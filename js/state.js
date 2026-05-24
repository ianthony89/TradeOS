/* ============================================================
   TradeOS v4.0 — state
   Single source of truth for holdings. Persists to localStorage.
   Modules subscribe via onChange(fn) to react when state mutates.
   ============================================================ */

import { KEYS, get, set, remove, getSettings } from './storage.js';
import { recompute } from './domain/portfolio.js';

let _holdings = [];                   // recomputed (derived fields populated)
let _raw = [];                        // raw shape persisted to storage
const _listeners = new Set();

function _load() {
  const stored = get(KEYS.HOLDINGS, []);
  _raw = Array.isArray(stored) ? stored : [];
  _refresh();
}

function _refresh() {
  _holdings = recompute(_raw, getSettings());
}

function _persistAndEmit() {
  set(KEYS.HOLDINGS, _raw);
  _refresh();
  _emit();
}

function _emit() {
  _listeners.forEach(fn => { try { fn(_holdings); } catch (e) { console.error(e); } });
}

/* ---------- Public ---------- */

export function init() { _load(); }

export function getHoldings() { return _holdings; }
export function getRawHoldings() { return _raw.slice(); }

export function onChange(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

/** Recompute derived fields without changing raw data — for use after settings update. */
export function recomputeNow() {
  _refresh();
  _emit();
}

/** Replace the whole list. */
export function setHoldings(list) {
  _raw = (list || []).map(_sanitizeRaw);
  _persistAndEmit();
}

/** Insert or update by symbol. Returns the canonical row. */
export function upsertHolding(input) {
  const row = _sanitizeRaw(input);
  if (!row.symbol) return null;
  const idx = _raw.findIndex(h => h.symbol === row.symbol);
  if (idx >= 0) _raw[idx] = { ..._raw[idx], ...row };
  else          _raw.push(row);
  _persistAndEmit();
  return row;
}

export function removeHolding(symbol) {
  const sym = String(symbol || '').toUpperCase();
  const before = _raw.length;
  _raw = _raw.filter(h => h.symbol !== sym);
  if (_raw.length !== before) _persistAndEmit();
}

export function clearAll() {
  _raw = [];
  remove(KEYS.HOLDINGS);
  _refresh();
  _emit();
}

/* ---------- Internal ---------- */

function _sanitizeRaw(input) {
  const r = input || {};
  const out = {
    symbol:    String(r.symbol || '').toUpperCase().trim(),
    qty:       Number(r.qty) || 0,
    avgCost:   Number(r.avgCost) || 0,
    lastPrice: Number(r.lastPrice) || 0,
    currency:  (r.currency || 'USD').toUpperCase(),
    name:      r.name || '',
  };
  if (r.risk) out.risk = r.risk;   // preserve manual overrides
  if (r.note) out.note = r.note;
  return out;
}
