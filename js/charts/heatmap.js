/* ============================================================
   TradeOS v4.0 — charts/heatmap
   Position heatmap. HTML grid — tile area ~ market value;
   color reflects P/L%. Same squarified-ish layout as v3.7.
   ============================================================ */

import { fmt, escapeHtml } from '../domain/format.js';

function _colorFor(pct) {
  if (pct == null || isNaN(pct)) return 'hsl(220, 12%, 30%)';
  const clamped = Math.max(-30, Math.min(30, pct));
  const intensity = Math.abs(clamped) / 30;
  if (clamped >= 0) {
    const light = 18 + intensity * 30;
    const sat   = 60 + intensity * 25;
    return `hsl(155, ${sat}%, ${light}%)`;
  }
  const light = 22 + intensity * 24;
  const sat   = 65 + intensity * 25;
  return `hsl(348, ${sat}%, ${light}%)`;
}

/**
 * @param {HTMLElement} root
 * @param {Array} holdings   recomputed
 * @param {object} opts      { big?: boolean, onClickTile?: (sym) => void }
 * @returns {() => void} unmount
 */
export function renderHeatmap(root, holdings, opts = {}) {
  const big = !!opts.big;
  const onClickTile = typeof opts.onClickTile === 'function' ? opts.onClickTile : null;

  if (!holdings.length) {
    root.innerHTML = `<div class="empty"><div class="emo">▦</div><div class="ttl">—</div><div class="sub">Import or add positions to see the heatmap.</div></div>`;
    return () => {};
  }

  const total = holdings.reduce((a, h) => a + h.marketValue, 0) || 1;
  const data = [...holdings].sort((a, b) => b.marketValue - a.marketValue);

  const cols = big ? 18 : 12;
  const rows = big ? 14 : 8;
  const totalCells = cols * rows;

  const cells = data.map(h => ({
    h,
    cells: Math.max(1, Math.round((h.marketValue / total) * totalCells)),
  }));
  // Pack/shrink so the grid is exactly full
  let sum = cells.reduce((a, c) => a + c.cells, 0);
  while (sum > totalCells) {
    const max = cells.reduce((a, c) => (c.cells > a.cells ? c : a), cells[0]);
    max.cells--; sum--;
  }
  while (sum < totalCells && cells.length) {
    const max = cells.reduce((a, c) => (c.cells > a.cells ? c : a), cells[0]);
    max.cells++; sum++;
  }

  root.innerHTML = `
    <div class="heatmap" style="grid-template-columns:repeat(${cols}, 1fr);grid-auto-rows:${big ? 40 : 38}px;">
      ${cells.map((c, i) => {
        const colSpan = Math.min(cols, c.cells <= cols ? c.cells : cols);
        const rowSpan = Math.max(1, Math.floor(c.cells / cols));
        return `<div class="tile" data-sym="${escapeHtml(c.h.symbol)}"
          style="grid-column: span ${colSpan}; grid-row: span ${rowSpan}; background:${_colorFor(c.h.plPct)}; animation: viewIn 400ms var(--ease-out) ${i * 20}ms backwards;"
          title="${escapeHtml(c.h.symbol)} · ${fmt.pct(c.h.plPct)} · ${fmt.usd(c.h.marketValue)}">
          <div class="t-sym">${escapeHtml(c.h.symbol)}</div>
          <div class="t-pct">${fmt.pct(c.h.plPct)}</div>
        </div>`;
      }).join('')}
    </div>`;

  const handlers = [];
  if (onClickTile) {
    root.querySelectorAll('.tile').forEach(tile => {
      const h = () => onClickTile(tile.dataset.sym);
      tile.addEventListener('click', h);
      handlers.push({ tile, h });
    });
  }

  return () => handlers.forEach(({ tile, h }) => tile.removeEventListener('click', h));
}
