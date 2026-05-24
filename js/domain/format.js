/* ============================================================
   TradeOS v4.0 — domain/format
   Number/currency/percent helpers. Locale-agnostic for fintech feel.
   ============================================================ */

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const USDC = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const MYR = new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR', maximumFractionDigits: 0 });
const NUM = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

export const fmt = {
  usd:  (n) => USD.format(Number(n) || 0),
  usdC: (n) => USDC.format(Number(n) || 0),
  myr:  (n) => MYR.format(Number(n) || 0),
  num:  (n) => NUM.format(Number(n) || 0),
  pct:  (n) => {
    const v = Number(n) || 0;
    const sign = v > 0 ? '+' : '';
    return `${sign}${v.toFixed(2)}%`;
  },
};

export function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
