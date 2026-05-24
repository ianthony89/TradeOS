/* ============================================================
   TradeOS v4.0 — domain/portfolio
   Per-position derived fields + portfolio-level aggregates.
   Pure. Takes `(holdings, settings)` and never mutates inputs.
   ============================================================ */

import { toUSD } from './fx.js';
import { classifyRisk, classifyStatus, suggestedAction, detectMarket } from './risk.js';

/**
 * Return a new holdings array with all derived fields recomputed:
 *   marketValueLocal, plLocal, marketValue (USD), plUSD, plPct,
 *   risk, status, action, market.
 *
 * Caller passes immutable input — useful for predictable rendering.
 */
export function recompute(holdings, settings) {
  const rates = settings && settings.fxRates;
  return (holdings || []).map(raw => {
    const h = { ...raw };
    h.qty       = Number(h.qty) || 0;
    h.avgCost   = Number(h.avgCost) || 0;
    h.lastPrice = Number(h.lastPrice) || 0;
    h.currency  = (h.currency || 'USD').toUpperCase();

    h.marketValueLocal = h.qty * h.lastPrice;
    h.plLocal          = (h.lastPrice - h.avgCost) * h.qty;
    h.marketValue      = toUSD(h.marketValueLocal, h.currency, rates);
    h.plUSD            = toUSD(h.plLocal, h.currency, rates);
    h.plPct            = h.avgCost > 0 ? ((h.lastPrice / h.avgCost) - 1) * 100 : 0;

    if (!h.risk) h.risk = classifyRisk(h.symbol);
    h.status = classifyStatus(h);
    h.action = suggestedAction(h);
    h.market = detectMarket(h.symbol, h.currency);
    return h;
  });
}

/** Apply the user's ALL/MY/US market filter to a recomputed holdings list. */
export function applyMarketFilter(holdings, filter) {
  if (!filter || filter === 'ALL') return holdings;
  return holdings.filter(h => h.market === filter);
}

/**
 * Roll up portfolio stats from a recomputed holdings array.
 * settings.cash is included as raw USD.
 */
export function getStats(holdings, settings) {
  const arr = holdings || [];
  const cash = Number(settings && settings.cash) || 0;

  const totalMV   = arr.reduce((a, h) => a + h.marketValue, 0);
  const totalCost = arr.reduce((a, h) => a + toUSD(h.qty * h.avgCost, h.currency, settings && settings.fxRates), 0);
  const totalPL   = totalMV - totalCost;
  const totalPLPct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

  const winners = arr.filter(h => h.plUSD > 0).length;
  const losers  = arr.filter(h => h.plUSD < 0).length;

  const portfolio = totalMV + cash;

  const levExposure  = arr.filter(h => h.risk === 'LEVERAGED').reduce((a, h) => a + h.marketValue, 0);
  const specExposure = arr.filter(h => h.risk === 'SPECULATIVE').reduce((a, h) => a + h.marketValue, 0);
  const levPct  = portfolio > 0 ? (levExposure  / portfolio) * 100 : 0;
  const specPct = portfolio > 0 ? (specExposure / portfolio) * 100 : 0;
  const riskPct = portfolio > 0 ? ((levExposure + specExposure) / portfolio) * 100 : 0;

  return {
    totalMV, totalCost, totalPL, totalPLPct,
    winners, losers, cash, portfolio,
    levExposure, specExposure, levPct, specPct, riskPct,
    count: arr.length,
  };
}

/** Top-N by market value with the remainder bucketed as "Other". Used by donut. */
export function topNByMV(holdings, n = 8) {
  const sorted = [...holdings].sort((a, b) => b.marketValue - a.marketValue);
  const top = sorted.slice(0, n);
  const rest = sorted.slice(n);
  if (rest.length) {
    top.push({
      symbol: 'Other',
      marketValue: rest.reduce((a, h) => a + h.marketValue, 0),
      plPct: 0,
    });
  }
  return top;
}

/** Top winners and losers by plPct. */
export function topMovers(holdings, n = 3) {
  const sorted = [...holdings].sort((a, b) => b.plPct - a.plPct);
  return {
    winners: sorted.slice(0, n),
    losers:  sorted.slice(-n).reverse(),
  };
}

/** Risk-class market-value buckets for the bars chart. */
export function riskBuckets(holdings) {
  const groups = ['CORE','MOMENTUM','TACTICAL','SPECULATIVE','LEVERAGED'];
  const totals = {};
  groups.forEach(g => { totals[g] = 0; });
  holdings.forEach(h => { totals[h.risk] = (totals[h.risk] || 0) + h.marketValue; });
  return totals;
}
