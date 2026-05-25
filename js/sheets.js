/* ============================================================
   TradeOS v4.0 — sheets
   High-level adapter between the GAS API and our stores.

   Each kind has a list of canonical fields and a list of accepted
   header aliases (lowercase, trimmed). Aliases include English,
   common broker variants, and a few Simplified Chinese terms so a
   bilingual sheet works out of the box.

   Numeric / boolean coercion lives here so stores receive
   already-typed rows.
   ============================================================ */

import * as Api from './api.js';

const ALIASES = {
  holdings: {
    symbol:    ['symbol', 'ticker', 'code', 'stock', '代码'],
    qty:       ['qty', 'quantity', 'shares', 'units', 'position', '数量', '持有数量'],
    avgCost:   ['avgcost', 'avg cost', 'average cost', 'cost', 'cost basis', 'avg price', 'book price', '成本价', '平均成本价'],
    lastPrice: ['lastprice', 'last price', 'last', 'price', 'market price', 'current', 'current price', '现价'],
    currency:  ['currency', 'ccy', '币种'],
    name:      ['name', 'company', 'company name', '名称'],
    risk:      ['risk', 'risk class', '风险'],
    note:      ['note', 'notes', '备注'],
  },
  watchlist: {
    ticker:   ['ticker', 'symbol', 'code', '代码'],
    priority: ['priority', '优先级'],
    risk:     ['risk', 'risk class', '风险'],
    catalyst: ['catalyst', '催化剂'],
    urgency:  ['urgency', '紧迫度'],
    note:     ['note', 'thesis', 'notes', '备注', '关注理由'],
    added:    ['added', 'date', 'added date', '日期'],
  },
  journal: {
    date:    ['date', 'when', '日期'],
    ticker:  ['ticker', 'symbol', 'code', '代码'],
    action:  ['action', 'side', 'op', '操作'],
    reason:  ['reason', 'thesis', 'setup', 'rationale', '理由', '计划'],
    emotion: ['emotion', 'mood', 'feeling', '心理', '情绪'],
    lesson:  ['lesson', 'takeaway', 'learned', '总结', '教训'],
  },
};

const NUMERIC = {
  holdings:  ['qty', 'avgCost', 'lastPrice'],
};

function _toLowerKeys(row) {
  const out = {};
  for (const k of Object.keys(row || {})) {
    out[String(k).toLowerCase().trim()] = row[k];
  }
  return out;
}

function _coerce(val) {
  if (val == null) return val;
  if (typeof val === 'number' || typeof val === 'boolean') return val;
  const s = String(val).trim();
  if (s === '') return '';
  // Parens-as-negative
  const isNeg = /^\(.*\)$/.test(s);
  const cleaned = s.replace(/[(),\s$£¥€₹]/g, '');
  if (cleaned === '' || isNaN(Number(cleaned))) return s;
  return (isNeg ? -1 : 1) * Number(cleaned);
}

function _isoDateString(v) {
  if (v == null || v === '') return '';
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function _normalize(rows, kind) {
  const aliases = ALIASES[kind] || {};
  const numericFields = new Set(NUMERIC[kind] || []);
  const fields = Object.keys(aliases);

  return (rows || []).map(raw => {
    const lower = _toLowerKeys(raw);
    const out = {};
    for (const canonical of fields) {
      const candidates = aliases[canonical];
      for (const c of candidates) {
        const key = c.toLowerCase();
        if (key in lower && lower[key] !== '' && lower[key] != null) {
          out[canonical] = lower[key];
          break;
        }
      }
    }
    // Coerce numerics
    for (const k of numericFields) {
      if (out[k] != null) out[k] = Number(_coerce(out[k])) || 0;
    }
    // Currency uppercase + default
    if (kind === 'holdings') {
      out.currency = (out.currency || 'USD').toString().toUpperCase();
      out.symbol   = (out.symbol || '').toString().toUpperCase().trim();
    }
    if (kind === 'watchlist') {
      out.ticker = (out.ticker || '').toString().toUpperCase().trim();
    }
    if (kind === 'journal') {
      out.ticker = (out.ticker || '').toString().toUpperCase().trim();
      out.date   = _isoDateString(out.date);
    }
    return out;
  }).filter(r => {
    // Drop rows that have no identifying key
    if (kind === 'holdings')  return !!r.symbol;
    if (kind === 'watchlist') return !!r.ticker;
    if (kind === 'journal')   return !!(r.date || r.ticker);
    return true;
  });
}

/* ---------- Public fetchers ---------- */

export async function fetchHoldings() {
  const rows = await Api.call('holdings.list');
  return _normalize(rows, 'holdings');
}

export async function fetchWatchlist() {
  const rows = await Api.call('watchlist.list');
  return _normalize(rows, 'watchlist');
}

export async function fetchJournal() {
  const rows = await Api.call('journal.list');
  return _normalize(rows, 'journal');
}

/** Exposed for unit-test / debug. */
export const _internal = { ALIASES, _normalize };
