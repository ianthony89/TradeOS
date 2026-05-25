/* ============================================================
   TradeOS v4.0 — stores/holdings
   Source of truth for the user's holdings. Persisted locally
   (so the dashboard renders instantly before sync completes)
   and refreshed from the Google Sheet on every sync tick.
   ============================================================ */

import { KEYS, get, set, remove, getSettings } from '../storage.js';
import { recompute } from '../domain/portfolio.js';
import * as Sync   from '../sync.js';
import * as Sheets from '../sheets.js';
import * as Quotes from '../quotes.js';
import { toast } from '../toast.js';

let _holdings = [];        // recomputed (derived fields populated)
let _raw = [];             // raw shape persisted to storage
const _listeners = new Set();

function _load() {
  const stored = get(KEYS.HOLDINGS, []);
  _raw = Array.isArray(stored) ? stored : [];
  _refresh();
}

function _refresh() {
  _holdings = recompute(_raw, getSettings(), Quotes.getAll());
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

export function init() {
  _load();
  Sync.register('holdings', async () => {
    let rows;
    try {
      rows = await Sheets.fetchHoldings();
    } catch (e) {
      console.warn('[TradeOS holdings] fetchHoldings threw — keeping last known state:', e);
      toast('[Sync] Holdings fetch failed — kept last state', 'warn');
      return;
    }

    // Validate payload before overwriting: never replace valid data with empty/malformed response
    if (!Array.isArray(rows)) {
      console.warn('[TradeOS holdings] sync returned non-array payload — keeping last known state:', rows);
      toast('[Sync] Holdings response invalid — kept last state', 'warn');
      return;
    }
    if (rows.length === 0 && _raw.length > 0) {
      console.warn('[TradeOS holdings] sync returned empty array while local state has data — skipping overwrite');
      toast('[Sync] Empty holdings from server — kept last state', 'warn');
      return;
    }

    setHoldings(rows);
  });
  // Re-derive (and re-emit) whenever live quotes update so the dashboard
  // gets fresh marketValue / plUSD / dayChangePct without a sheet sync.
  Quotes.subscribe(() => { _refresh(); _emit(); });
}

export function getAll() { return _holdings; }
/** @deprecated v4.0 — use getAll(). Kept for migration period. */
export function getHoldings() { return _holdings; }
export function getRaw() { return _raw.slice(); }
/** @deprecated v4.0 — use getRaw(). */
export function getRawHoldings() { return _raw.slice(); }

export function onChange(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

/** Recompute derived fields without changing raw data — call after settings change. */
export function recomputeNow() { _refresh(); _emit(); }

/** Replace the whole list (used by sync ingestion + demo data + bulk import). */
export function setHoldings(list) {
  _raw = (list || []).map(_sanitizeRaw).filter(r => r.symbol);
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
  if (r.risk) out.risk = r.risk;
  if (r.note) out.note = r.note;
  return out;
}
