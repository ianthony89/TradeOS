/* ============================================================
   TradeOS v4.0 — domain/risk
   Ticker classification + per-position status + action hint.
   Pure functions. Ported verbatim from v3.7.
   ============================================================ */

export const LEVERAGED_TICKERS = new Set([
  'TQQQ','SQQQ','SOXL','SOXS','TSLL','TSLZ','NVDL','NVDU','NVDS','AMDL',
  'UPRO','SPXU','TECL','TECS','FAS','FAZ','LABU','LABD','SPXL','BOIL',
  'UVXY','SVXY','TNA','TZA','CURE','UDOW','SDOW','MSTU','MSTZ','CONL',
  'BITX','ETHU','MSTX','SMCX','SOXX','BITI',
]);

export const CORE_TICKERS = new Set([
  'AAPL','MSFT','GOOGL','GOOG','AMZN','META','BRK.B','BRK.A','JPM','V','MA',
  'WMT','UNH','XOM','JNJ','PG','KO','PEP','COST','HD','BAC','ABBV','LLY',
  'VOO','SPY','QQQ','VTI','SCHD','VYM','DIA','VEA','VWO','BND','TLT',
]);

export const MOMENTUM_TICKERS = new Set([
  'NVDA','AMD','TSLA','AVGO','SMCI','PLTR','CRWD','SNOW','NET','DDOG',
  'SHOP','UBER','ABNB','COIN','HOOD','MRVL','ARM','MU','ASML','TSM',
  'RKLB','SOFI','IONQ','RGTI',
]);

export const RISK_CLASSES = ['CORE','MOMENTUM','TACTICAL','SPECULATIVE','LEVERAGED'];

export function classifyRisk(symbol) {
  const s = (symbol || '').toUpperCase().trim();
  if (LEVERAGED_TICKERS.has(s)) return 'LEVERAGED';
  if (/(2X|3X|BULL|BEAR)$/.test(s)) return 'LEVERAGED';
  if (CORE_TICKERS.has(s)) return 'CORE';
  if (MOMENTUM_TICKERS.has(s)) return 'MOMENTUM';
  if (s.length <= 2 || /^\$?[A-Z]{1,2}\d/.test(s)) return 'SPECULATIVE';
  return 'TACTICAL';
}

export function classifyStatus(h) {
  const pct = h.plPct;
  if (pct == null || isNaN(pct)) return 'WATCH';
  if (pct >= 5)               return 'HEALTHY';
  if (pct > -5 && pct < 5)    return 'WATCH';
  if (pct >= -20)             return 'WEAK';
  return 'DEAD';
}

export function suggestedAction(h) {
  const { risk, plPct: pct } = h;
  if (pct == null) return 'HOLD';
  if (risk === 'LEVERAGED' && pct < -15) return 'EXIT';
  if (risk === 'LEVERAGED' && pct > 25)  return 'TRIM';
  if (pct < -25)                          return 'EXIT';
  if (pct < -12)                          return 'REDUCE';
  if (pct > 30 && risk !== 'CORE')        return 'TRIM';
  if (pct > 8  && risk === 'CORE')        return 'ADD';
  if (pct >= -5 && pct <= 5)              return 'WATCH';
  return 'HOLD';
}

/** Bursa numeric / .KL → MY ; HKD → HK ; else US */
export function detectMarket(symbol, currency) {
  const s = (symbol || '').toUpperCase();
  const c = (currency || 'USD').toUpperCase();
  if (c === 'MYR') return 'MY';
  if (/^\d{3,5}$/.test(s)) return 'MY';
  if (/\.KL$/.test(s))     return 'MY';
  if (c === 'HKD' || /^\d{4,5}\.HK$/.test(s)) return 'HK';
  return 'US';
}
