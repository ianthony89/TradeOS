/* ============================================================
   TradeOS v4.0 — domain/fx
   Pure currency-conversion helpers. Settings carries fxRates;
   defaults below match v3.7.
   ============================================================ */

export const DEFAULT_FX_RATES = {
  USD_MYR: 4.00,
  HKD_USD: 0.128,
  SGD_USD: 0.74,
  CNY_USD: 0.138,
};

/**
 * Convert a value in native currency to USD.
 * @param {number} value
 * @param {string} [currency='USD']
 * @param {object} [rates] – { USD_MYR, HKD_USD, SGD_USD, CNY_USD }
 */
export function toUSD(value, currency, rates) {
  if (!value || isNaN(value)) return 0;
  const cur = (currency || 'USD').toUpperCase();
  const fx = { ...DEFAULT_FX_RATES, ...(rates || {}) };
  switch (cur) {
    case 'USD': return value;
    case 'HKD': return value * fx.HKD_USD;
    case 'SGD': return value * fx.SGD_USD;
    case 'CNY':
    case 'RMB': return value * fx.CNY_USD;
    case 'MYR': return value / fx.USD_MYR;
    default:    return value;
  }
}

/** Convert a USD value to MYR for footer/display contexts. */
export function inMYR(usd, rates) {
  const fx = { ...DEFAULT_FX_RATES, ...(rates || {}) };
  return (Number(usd) || 0) * fx.USD_MYR;
}
