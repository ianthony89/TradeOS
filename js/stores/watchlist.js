/* ============================================================
   TradeOS v4.0 — stores/watchlist
   Watchlist items synced from the Watchlist sheet.

   Row shape (post-normalization in js/sheets.js):
     { ticker, priority, risk, catalyst, urgency, note, added }
   ============================================================ */

import { KEYS, get, set, remove } from '../storage.js';
import * as Sync   from '../sync.js';
import * as Sheets from '../sheets.js';

let _items = [];
const _listeners = new Set();

function _load() {
  const stored = get(KEYS.WATCHLIST, []);
  _items = Array.isArray(stored) ? stored.map(_sanitize) : [];
}

function _persistAndEmit() {
  set(KEYS.WATCHLIST, _items);
  _listeners.forEach(fn => { try { fn(_items); } catch (e) { console.error(e); } });
}

function _sanitize(r) {
  r = r || {};
  return {
    ticker:   String(r.ticker || '').toUpperCase().trim(),
    priority: r.priority || 'NORMAL',
    risk:     r.risk || 'TACTICAL',
    catalyst: r.catalyst || '',
    urgency:  r.urgency || 'LOW',
    note:     r.note || '',
    added:    r.added || '',
  };
}

/* ---------- Public ---------- */

export function init() {
  _load();
  Sync.register('watchlist', async () => {
    const rows = await Sheets.fetchWatchlist();
    setAll(rows);
  });
}

export function getAll() { return _items; }

export function onChange(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

export function setAll(rows) {
  _items = (rows || []).map(_sanitize).filter(r => r.ticker);
  _persistAndEmit();
}

export function clearAll() {
  _items = [];
  remove(KEYS.WATCHLIST);
  _persistAndEmit();
}
