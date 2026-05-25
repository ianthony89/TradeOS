/* ============================================================
   TradeOS v4.0 — stores/journal
   Journal entries synced from the Journal sheet.

   Row shape (post-normalization in js/sheets.js):
     { date, ticker, action, reason, emotion, lesson }
   ============================================================ */

import { KEYS, get, set, remove } from '../storage.js';
import * as Sync   from '../sync.js';
import * as Sheets from '../sheets.js';

let _entries = [];
const _listeners = new Set();

function _load() {
  const stored = get(KEYS.JOURNAL, []);
  _entries = Array.isArray(stored) ? stored.map(_sanitize) : [];
}

function _persistAndEmit() {
  set(KEYS.JOURNAL, _entries);
  _listeners.forEach(fn => { try { fn(_entries); } catch (e) { console.error(e); } });
}

function _sanitize(r) {
  r = r || {};
  return {
    date:    r.date || '',
    ticker:  String(r.ticker || '').toUpperCase().trim(),
    action:  String(r.action || '').toUpperCase().trim() || 'BUY',
    reason:  r.reason || '',
    emotion: r.emotion || '',
    lesson:  r.lesson || '',
  };
}

/* ---------- Public ---------- */

export function init() {
  _load();
  Sync.register('journal', async () => {
    const rows = await Sheets.fetchJournal();
    setAll(rows);
  });
}

export function getAll() {
  // Return newest first by date string (ISO sorts lexicographically)
  return [..._entries].sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

export function onChange(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

export function setAll(rows) {
  _entries = (rows || []).map(_sanitize);
  _persistAndEmit();
}

export function clearAll() {
  _entries = [];
  remove(KEYS.JOURNAL);
  _persistAndEmit();
}
