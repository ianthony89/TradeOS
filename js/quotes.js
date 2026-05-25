/* ============================================================
   TradeOS v4.0 — quotes (Phase 5.1 — manual mode + visibility)
   Live market-price engine. Independent configurable-interval loop,
   separate from the sheet sync — different cadence, different failure
   modes, different timeout needs.

   Data path:
     Holdings sheet (sync)  →  symbol / qty / avgCost / currency
     Quotes engine (poll)   →  live lastPrice + prevClose + dayChangePct
     domain/portfolio.recompute() merges them — live price wins,
     sheet's lastPrice is the graceful fallback when no quote yet.

   Phase 5.1 changes:
   - Default interval: 5 min (300s); 0 = manual only
   - Pauses timer when tab hidden; resumes + refresh on tab focus
   - On API failure, cache is kept — no fake/demo fallback
   ============================================================ */

import * as Api from './api.js';
import * as Holdings from './stores/holdings.js';
import { KEYS, get, set } from './storage.js';

export const STATES = Object.freeze({
  UNCONFIGURED: 'unconfigured',
  IDLE:         'idle',
  FETCHING:     'fetching',
  OK:           'ok',
  ERROR:        'error',
  OFFLINE:      'offline',
});

const _quotes = new Map();     // SYMBOL → { price, prevClose, change, changePct, currency, ts, source }
const _listeners = new Set();
let _state     = STATES.IDLE;
let _lastError = null;
let _lastAt    = null;
let _lastOk    = null;
let _intervalMs = 300_000;    // 5 min default; 0 = manual only
let _timer = null;
let _running = false;
let _netBound = false;
let _visBound = false;
let _holdingsUnsub = null;

/* ---------- Public ---------- */

export function getQuote(symbol) {
  if (!symbol) return null;
  return _quotes.get(String(symbol).toUpperCase()) || null;
}

/** Plain object form. Cheap — used inside Holdings.recompute(). */
export function getAll() {
  const out = {};
  _quotes.forEach((v, k) => { out[k] = v; });
  return out;
}

export function getState() {
  return {
    state: _state,
    lastError: _lastError,
    lastAt: _lastAt,
    lastOk: _lastOk,
    intervalMs: _intervalMs,
    count: _quotes.size,
  };
}

export function subscribe(fn) {
  _listeners.add(fn);
  try { fn(getState(), getAll()); } catch (e) {}
  return () => _listeners.delete(fn);
}

function _emit() {
  const snap = getState();
  const all  = getAll();
  _listeners.forEach(fn => { try { fn(snap, all); } catch (e) {} });
}

function _setState(next, errorMsg) {
  _state = next;
  _lastError = errorMsg || null;
  _emit();
}

/** Load cached quotes from localStorage so the first paint after a refresh
 *  already has prices. */
function _load() {
  const stored = get(KEYS.QUOTES, {}) || {};
  for (const k of Object.keys(stored)) _quotes.set(k, stored[k]);
  _lastAt = get(KEYS.QUOTES_LAST_AT, null);
  _lastOk = get(KEYS.QUOTES_LAST_OK, null);
}

function _persist() {
  set(KEYS.QUOTES, getAll());
  set(KEYS.QUOTES_LAST_AT, _lastAt);
  set(KEYS.QUOTES_LAST_OK, _lastOk);
}

function _bindNetwork() {
  if (_netBound) return;
  _netBound = true;
  window.addEventListener('offline', () => _setState(STATES.OFFLINE));
  window.addEventListener('online',  () => {
    if (_state === STATES.OFFLINE) _setState(STATES.IDLE);
    runOnce();
  });
}

/** Pause timer when tab hidden, resume + refresh when tab visible again. */
function _bindVisibility() {
  if (_visBound) return;
  _visBound = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // Pause — clear timer but keep _running flag
      if (_timer) { window.clearInterval(_timer); _timer = null; }
    } else {
      // Resume — restart timer and run immediately
      if (_running && _intervalMs > 0 && !_timer) {
        runOnce();
        _timer = window.setInterval(() => runOnce(), _intervalMs);
      }
    }
  });
}

/** Run one fetch pass. Safe to call any time. */
export async function runOnce() {
  if (_state === STATES.FETCHING) return;
  if (!navigator.onLine)         { _setState(STATES.OFFLINE); return; }
  if (!Api.isConfigured())       { _setState(STATES.UNCONFIGURED); return; }

  const holdings = Holdings.getAll();
  const symbols = holdings.map(h => h.symbol).filter(Boolean);
  const uniq = Array.from(new Set(symbols));
  if (!uniq.length) { _setState(STATES.IDLE); return; }

  // Send a currency hint per symbol so the server picks the right Yahoo
  // suffix (.KL for Bursa, .HK for HKEX) without ambiguous heuristics.
  const meta = {};
  holdings.forEach(h => {
    if (h.symbol && h.currency) meta[h.symbol] = { currency: h.currency };
  });

  _setState(STATES.FETCHING);

  try {
    const data = await Api.call('quotes.fetch', { symbols: uniq, meta }, { timeoutMs: 20_000 });
    if (data && typeof data === 'object') {
      // Update only the symbols that came back successfully. Missing ones
      // keep their cached value rather than being wiped.
      for (const sym of Object.keys(data)) {
        const q = data[sym];
        if (!q || q.price == null) continue;
        _quotes.set(String(sym).toUpperCase(), {
          price:      Number(q.price),
          prevClose:  q.prevClose != null ? Number(q.prevClose) : null,
          change:     q.change    != null ? Number(q.change)    : null,
          changePct:  q.changePct != null ? Number(q.changePct) : null,
          currency:   q.currency || null,
          ts:         q.ts ? Number(q.ts) : Date.now(),
          source:     q.source || 'live',
        });
      }
    }
    _lastAt = Date.now();
    _lastOk = _lastAt;
    _persist();
    _setState(STATES.OK);
  } catch (e) {
    _lastAt = Date.now();
    _persist();   // persist lastAt timestamp even on failure
    _setState(STATES.ERROR, e.message || String(e));
  }
}

/**
 * Set the auto-poll interval.
 * seconds = 0 → manual only (no auto timer).
 * Restarts loop if currently running.
 */
export function setIntervalSec(seconds) {
  const n = Number(seconds);
  _intervalMs = (n > 0) ? Math.max(15, Math.min(3600, n)) * 1000 : 0;

  if (!_running) return;

  // Restart timer with new cadence
  if (_timer) { window.clearInterval(_timer); _timer = null; }
  if (_intervalMs > 0) {
    _timer = window.setInterval(() => runOnce(), _intervalMs);
  }
}

export function start() {
  if (_running) return;
  _bindNetwork();
  _bindVisibility();
  _load();

  // Re-fetch immediately when a new symbol appears in holdings
  if (!_holdingsUnsub) {
    _holdingsUnsub = Holdings.onChange(() => {
      const have = new Set(_quotes.keys());
      const need = Holdings.getAll().map(h => h.symbol);
      if (need.some(s => s && !have.has(s))) runOnce();
    });
  }

  _running = true;
  runOnce();
  // Only start a timer if interval > 0 (non-manual mode)
  if (_intervalMs > 0) {
    _timer = window.setInterval(() => runOnce(), _intervalMs);
  }
}

export function stop() {
  _running = false;
  if (_timer) { window.clearInterval(_timer); _timer = null; }
  if (_state === STATES.FETCHING) _setState(STATES.IDLE);
}
