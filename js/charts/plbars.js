/* ============================================================
   TradeOS v4.0 — charts/plbars
   P/L by position. HTML/CSS grid — not canvas. Responsive,
   centered zero axis, 6%-min visible width.
   ============================================================ */

import { fmt, escapeHtml } from '../domain/format.js';

const MIN_VISIBLE_PCT = 6;

/**
 * @param {HTMLElement} root      container to render into
 * @param {Array} holdings        recomputed
 * @param {number} [limit=14]     max rows shown (top + bottom by P/L)
 * @returns {() => void} unmount (removes click listeners)
 */
export function renderPLBars(root, holdings, opts = {}) {
  const limit = opts.limit || 14;
  const onClickRow = typeof opts.onClickRow === 'function' ? opts.onClickRow : null;

  const data = [...holdings].sort((a, b) => b.plUSD - a.plUSD).slice(0, limit);
  if (!data.length) {
    root.innerHTML = `<div class="empty"><div class="emo">∼</div><div class="ttl">—</div><div class="sub">No positions to chart.</div></div>`;
    return () => {};
  }

  const maxAbs = Math.max(...data.map(d => Math.abs(d.plUSD))) || 1;

  root.innerHTML = data.map(d => {
    const isPos = d.plUSD >= 0;
    let pct = (Math.abs(d.plUSD) / maxAbs) * 100;
    if (Math.abs(d.plUSD) > 0.005 && pct < MIN_VISIBLE_PCT) pct = MIN_VISIBLE_PCT;
    pct = Math.min(100, pct);
    return `
      <div class="plchart-row" data-sym="${escapeHtml(d.symbol)}">
        <div class="pl-ticker"><span class="pl-sym">${escapeHtml(d.symbol)}</span></div>
        <div class="pl-track">
          <div class="pl-neg">${!isPos ? `<div class="pl-bar neg" style="width:${pct}%;"></div>` : ''}</div>
          <div class="pl-axis"></div>
          <div class="pl-pos">${isPos  ? `<div class="pl-bar pos" style="width:${pct}%;"></div>` : ''}</div>
        </div>
        <div class="pl-value ${isPos ? 'pos' : 'neg'}">${fmt.usd(d.plUSD)}</div>
      </div>`;
  }).join('');

  const handlers = [];
  if (onClickRow) {
    root.querySelectorAll('.plchart-row').forEach(row => {
      const h = () => onClickRow(row.dataset.sym);
      row.addEventListener('click', h);
      handlers.push({ row, h });
    });
  }

  return () => handlers.forEach(({ row, h }) => row.removeEventListener('click', h));
}
