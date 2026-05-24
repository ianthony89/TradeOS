/* ============================================================
   TradeOS v4.0 — charts/donut
   Allocation donut. Hand-rolled canvas, DPR-aware.
   Animates in. Hover tooltip for slices.
   ============================================================ */

import { topNByMV } from '../domain/portfolio.js';
import { fmt } from '../domain/format.js';

const PALETTE = ['#4ea7ff','#8b6dff','#2ee6a8','#ffb547','#ff5876','#b58bff','#5fffe1','#ffd24a','#9aa6ff','#ff9466'];

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
  canvas.width  = rect.width  * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);
  return { ctx, w: rect.width, h: rect.height };
}

function _ease(t) { return 1 - Math.pow(1 - t, 3); }

/**
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLElement} legendEl
 * @param {HTMLElement} tipEl
 * @param {Array} holdings  recomputed
 * @returns {() => void} unmount fn (cancels rAF + hover listeners)
 */
export function renderDonut(canvas, legendEl, tipEl, holdings) {
  let raf = null;
  const data = topNByMV(holdings, 8).filter(d => d.marketValue > 0);
  const total = data.reduce((a, d) => a + d.marketValue, 0);

  function draw(progress) {
    const dims = _setupCanvas(canvas);
    if (!dims) return;
    const { ctx, w, h } = dims;
    const cx = w / 2, cy = h / 2;
    const r = Math.min(cx, cy) - 14;
    const inner = r * 0.62;

    if (!total) {
      ctx.fillStyle = 'rgba(130,180,255,0.20)';
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath(); ctx.arc(cx, cy, inner, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = _themeColor('--text-mute', '#5a6480');
      ctx.font = '12px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('—', cx, cy);
      if (legendEl) legendEl.innerHTML = '';
      return;
    }

    let start = -Math.PI / 2;
    const sweepTotal = Math.PI * 2 * progress;
    data.forEach((d, i) => {
      const slice = (d.marketValue / total) * Math.PI * 2;
      const drawSlice = Math.min(slice, Math.max(0, sweepTotal - (start + Math.PI / 2)));
      if (drawSlice <= 0) return;
      const color = PALETTE[i % PALETTE.length];
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, start + drawSlice);
      ctx.closePath();
      const grad = ctx.createRadialGradient(cx, cy, inner * 0.8, cx, cy, r);
      grad.addColorStop(0, color + 'DD');
      grad.addColorStop(1, color);
      ctx.fillStyle = grad;
      ctx.shadowColor = color; ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
      start += slice;
    });

    // Cut inner hole
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath(); ctx.arc(cx, cy, inner, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // Border ring
    ctx.strokeStyle = 'rgba(130,180,255,0.10)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, inner + 0.5, 0, Math.PI * 2); ctx.stroke();

    // Center total
    if (progress > 0.85) {
      const fade = (progress - 0.85) / 0.15;
      ctx.globalAlpha = fade;
      ctx.fillStyle = _themeColor('--text', '#eef3ff');
      ctx.font = 'bold 20px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(fmt.usdC(total), cx, cy - 2);
      ctx.fillStyle = _themeColor('--text-mute', '#5a6480');
      ctx.font = '600 10px -apple-system, sans-serif';
      ctx.fillText('MARKET VALUE', cx, cy + 16);
      ctx.globalAlpha = 1;
    }

    if (legendEl) {
      legendEl.innerHTML = data.map((d, i) => `
        <div class="lg"><span class="sw" style="background:${PALETTE[i % PALETTE.length]};color:${PALETTE[i % PALETTE.length]}"></span>${d.symbol} <span class="muted">${((d.marketValue / total) * 100).toFixed(1)}%</span></div>
      `).join('');
    }
  }

  function animate() {
    const startT = performance.now();
    const dur = 900;
    function step(now) {
      const p = Math.min(1, (now - startT) / dur);
      draw(_ease(p));
      if (p < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
  }

  function onMove(e) {
    if (!tipEl || !total) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2, cy = rect.height / 2;
    const dx = x - cx, dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const r = Math.min(cx, cy) - 14;
    const inner = r * 0.62;
    if (dist < inner || dist > r) { tipEl.classList.remove('show'); return; }
    let angle = Math.atan2(dy, dx) + Math.PI / 2;
    if (angle < 0) angle += Math.PI * 2;
    let acc = 0;
    for (const d of data) {
      const sweep = (d.marketValue / total) * Math.PI * 2;
      if (angle >= acc && angle <= acc + sweep) {
        tipEl.innerHTML = `<div class="t-label">${d.symbol}</div><div class="t-value">${fmt.usd(d.marketValue)} · ${((d.marketValue / total) * 100).toFixed(1)}%</div>`;
        tipEl.style.left = x + 'px';
        tipEl.style.top = y + 'px';
        tipEl.classList.add('show');
        return;
      }
      acc += sweep;
    }
    tipEl.classList.remove('show');
  }
  function onLeave() { if (tipEl) tipEl.classList.remove('show'); }

  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mouseleave', onLeave);
  animate();

  return () => {
    if (raf) cancelAnimationFrame(raf);
    canvas.removeEventListener('mousemove', onMove);
    canvas.removeEventListener('mouseleave', onLeave);
  };
}
