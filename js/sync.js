/* ============================================================
   TradeOS v4.0 — sync engine
   Runs every N seconds (default 30). On each tick:
     1. ping the API
     2. invoke every registered sync handler in sequence
   Emits state events so the topbar pill stays current.

   Phase 1: only the ping handler is exercised. Phase 2+ modules
   can register their own handlers via sync.register('holdings', fn).
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
let _intervalMs = 30000;
let _timer = null;
let _running = false;
let _authUnsubscribe = null;
let _netBound = false;

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

/** Update tick interval (seconds). Min 5s, max 1h. Restarts loop if running. */
export function setIntervalSec(seconds) {
  const s = Math.max(5, Math.min(3600, Number(seconds) || 30));
  _intervalMs = s * 1000;
  if (_running) { stop(); start(); }
}

export function start() {
  if (_running) return;
  _bindNetwork();

  if (!_authUnsubscribe) {
    _authUnsubscribe = Auth.onChange((locked) => {
      if (locked) { stop(); }
      else        { if (!_running) { start(); } runOnce(); }
    });
  }

  _running = true;
  runOnce();
  // Use window.setInterval explicitly — module exports do NOT shadow globals,
  // but being explicit makes intent obvious.
  _timer = window.setInterval(() => runOnce(), _intervalMs);
}

export function stop() {
  _running = false;
  if (_timer) { window.clearInterval(_timer); _timer = null; }
  if (_state === STATES.SYNCING) _setState(STATES.IDLE);
}
