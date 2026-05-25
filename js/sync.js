/* ============================================================
   TradeOS v4.0 — sync engine (Phase 5.1 — stability + visibility)
   Runs on configurable interval (default: manual / 0 = no auto-poll).
   On each tick:
     1. ping the API
     2. invoke every registered sync handler in sequence
   Emits state events so the topbar pill stays current.

   Phase 5.1 changes:
   - intervalSec = 0 means manual-only (no auto timer)
   - Pauses timer when tab is hidden; resumes + runOnce on tab focus
   - Module handlers validate payload before overwriting store state
   ============================================================ */

import { KEYS, get, set } from './storage.js';
import { isConfigured, ping } from './api.js';
import * as Auth from './auth.js';

export const STATES = Object.freeze({
  UNCONFIGURED: 'unconfigured',
  IDLE:         'idle',
  SYNCING:      'syncing',
  OK:           'ok',
  ERROR:        'error',
  OFFLINE:      'offline',
});

let _state = STATES.IDLE;
let _lastError = null;
let _lastAt = get(KEYS.SYNC_LAST_AT, null);
let _lastOk = get(KEYS.SYNC_LAST_OK, null);
let _intervalMs = 0;          // 0 = manual only
let _timer = null;
let _running = false;
let _authUnsubscribe = null;
let _netBound = false;
let _visBound = false;

const _handlers = new Map();      // name -> async fn
const _listeners = new Set();     // (snapshot) => void

export function getState() {
  return {
    state: _state,
    lastError: _lastError,
    lastAt: _lastAt,
    lastOk: _lastOk,
    intervalMs: _intervalMs,
    running: _running,
  };
}

export function subscribe(fn) {
  _listeners.add(fn);
  try { fn(getState()); } catch (e) {}
  return () => _listeners.delete(fn);
}

function _emit() {
  const snap = getState();
  _listeners.forEach(fn => { try { fn(snap); } catch (e) {} });
}

function _setState(next, errorMsg = null) {
  _state = next;
  _lastError = errorMsg;
  _emit();
}

/** Register a per-module sync handler. Returns an unregister fn. */
export function register(name, fn) {
  _handlers.set(name, fn);
  return () => _handlers.delete(name);
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

/** One sync pass. Safe to call manually. Skips if locked or already running. */
export async function runOnce() {
  if (Auth.isLocked()) return;
  if (_state === STATES.SYNCING) return;
  if (!navigator.onLine) { _setState(STATES.OFFLINE); return; }
  if (!isConfigured()) { _setState(STATES.UNCONFIGURED); return; }

  _setState(STATES.SYNCING);
  try {
    await ping();
    for (const [name, fn] of _handlers.entries()) {
      try { await fn(); }
      catch (e) { throw new Error(`${name}: ${e.message || e}`); }
    }
    _lastAt = Date.now();
    _lastOk = _lastAt;
    set(KEYS.SYNC_LAST_AT, _lastAt);
    set(KEYS.SYNC_LAST_OK, _lastOk);
    _setState(STATES.OK);
  } catch (e) {
    _lastAt = Date.now();
    set(KEYS.SYNC_LAST_AT, _lastAt);
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
  _intervalMs = (n > 0) ? Math.max(5, Math.min(3600, n)) * 1000 : 0;

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

  if (!_authUnsubscribe) {
    _authUnsubscribe = Auth.onChange((locked) => {
      if (locked) { stop(); }
      else        { if (!_running) { start(); } runOnce(); }
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
  if (_state === STATES.SYNCING) _setState(STATES.IDLE);
}
