/* ============================================================
   TradeOS v4.0 — charts/bars
   Risk-class horizontal bars. Canvas, DPR-aware, animated.
   ============================================================ */

import { riskBuckets } from '../domain/portfolio.js';
import { fmt } from '../domain/format.js';

const COLORS = {
  CORE:        '#2ee6a8',
  MOMENTUM:    '#b58bff',
  TACTICAL:    '#4ea7ff',
  SPECULATIVE: '#ffb547',
  LEVERAGED:   '#ff5876',
};
const GROUPS = ['CORE','MOMENTUM','TACTICAL','SPECULATIVE','LEVERAGED'];

function _themeColor(varName, fallback) {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return v || fallback;
  } catch (e) { return fallback; }
}

function _setupCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);
  return { ctx, w: rect.width, h: rect.height };
}

function _roundRect(ctx, x, y, w, h, r) {
  if (w <= 0 || h <= 0) return;
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

function _ease(t) { return 1 - Math.pow(1 - t, 3); }

export function renderBars(canvas, legendEl, holdings) {
  let raf = null;
  const totals = riskBuckets(holdings);
  const portfolio = Math.max(1, Object.values(totals).reduce((a, b) => a + b, 0));
  const max = Math.max(...GROUPS.map(g => totals[g])) || 1;
  const hasAny = Object.values(totals).some(v => v > 0);

  function draw(progress) {
    const dims = _setupCanvas(canvas);
    if (!dims) return;
    const { ctx, w, h } = dims;

    if (!hasAny) {
      ctx.fillStyle = _themeColor('--text-mute', '#5a6480');
      ctx.font = '12px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('—', w / 2, h / 2);
      if (legendEl) legendEl.innerHTML = '';
      return;
    }

    const padL = 100, padR = 18, padT = 14, padB = 14;
    const innerW = w - padL - padR;
    const innerH = h - padT - padB;
    const bh = (innerH - (GROUPS.length - 1) * 12) / GROUPS.length;

    GROUPS.forEach((g, i) => {
      const y = padT + i * (bh + 12);
      const v = totals[g];
      const bw = (v / max) * innerW * progress;

      ctx.fillStyle = _themeColor('--text-2', '#c2cde6');
      ctx.font = '600 11px -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(g, padL - 12, y + bh / 2 + 4);

      ctx.fillStyle = 'rgba(130,180,255,0.05)';
      _roundRect(ctx, padL, y, innerW, bh, 6); ctx.fill();

      if (bw > 1) {
        const grad = ctx.createLinearGradient(padL, 0, padL + bw, 0);
        grad.addColorStop(0, COLORS[g] + '66');
        grad.addColorStop(1, COLORS[g]);
        ctx.fillStyle = grad;
        ctx.shadowColor = COLORS[g]; ctx.shadowBlur = 6;
        _roundRect(ctx, padL, y, bw, bh, 6); ctx.fill();
        ctx.shadowBlur = 0;
      }

      if (progress > 0.7) {
        ctx.globalAlpha = (progress - 0.7) / 0.3;
        ctx.fillStyle = _themeColor('--text', '#eef3ff');
        ctx.font = '700 11px -apple-system, sans-serif';
        ctx.textAlign = 'left';
        const pct = (v / portfolio) * 100;
        ctx.fillText(`${pct.toFixed(1)}%`, padL + bw + 10, y + bh / 2 + 4);
        ctx.fillStyle = _themeColor('--text-mute', '#5a6480');
        ctx.font = '500 10px -apple-system, sans-serif';
        ctx.fillText(fmt.usd(v), padL + bw + 10, y + bh / 2 + 18);
        ctx.globalAlpha = 1;
      }
    });

    if (legendEl) {
      legendEl.innerHTML = GROUPS.map(g => `
        <div class="lg"><span class="sw" style="background:${COLORS[g]};color:${COLORS[g]}"></span>${g}</div>
      `).join('');
    }
  }

  const startT = performance.now();
  const dur = 800;
  function step(now) {
    const p = Math.min(1, (now - startT) / dur);
    draw(_ease(p));
    if (p < 1) raf = requestAnimationFrame(step);
  }
  raf = requestAnimationFrame(step);

  return () => { if (raf) cancelAnimationFrame(raf); };
}
