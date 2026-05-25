/* ============================================================
   TradeOS v4.0 — planner module (Phase 5)
   Trade Planner: position sizing calculator.
   Pure client-side computation — no API calls.
   Optionally auto-fills entry price from live quotes.
   ============================================================ */

import { t, applyI18n } from '../js/i18n.js';
import * as Quotes from '../js/quotes.js';
import { escapeHtml } from '../js/domain/format.js';
import { toast } from '../js/toast.js';

let _quoteUnsub = null;
let _lastSym = '';

export function mount(root) {
  root.innerHTML = `
    <div class="grid-2" style="align-items:start;">

      <!-- Input panel -->
      <div class="panel">
        <div class="panel-head">
          <h3 data-i18n="planner_title">${t('planner_title')}</h3>
        </div>
        <div class="panel-body">
          <div class="form-row">
            <div>
              <label data-i18n="planner_ticker">${t('planner_ticker')}</label>
              <div style="display:flex;gap:8px;align-items:center;">
                <input type="text" id="pTicker" placeholder="NVDA" style="flex:1;text-transform:uppercase"/>
                <span class="muted" id="pLiveHint" style="font-size:11px;white-space:nowrap;"></span>
              </div>
            </div>
            <div class="form-grid-2">
              <div>
                <label data-i18n="planner_entry">${t('planner_entry')}</label>
                <input type="number" id="pEntry" step="any" placeholder="0.00"/>
              </div>
              <div>
                <label data-i18n="planner_stop">${t('planner_stop')}</label>
                <input type="number" id="pStop" step="any" placeholder="0.00"/>
              </div>
            </div>
            <div class="form-grid-2">
              <div>
                <label data-i18n="planner_target">${t('planner_target')}</label>
                <input type="number" id="pTarget" step="any" placeholder="0.00"/>
              </div>
              <div>
                <label data-i18n="planner_risk">${t('planner_risk')}</label>
                <input type="number" id="pRisk" step="any" placeholder="500"/>
              </div>
            </div>
            <button class="btn primary" id="pCalc" data-i18n="planner_calc">${t('planner_calc')}</button>
          </div>
        </div>
      </div>

      <!-- Results panel -->
      <div class="panel" id="plannerResultPanel">
        <div class="panel-head">
          <h3 data-i18n="planner_result_t">${t('planner_result_t')}</h3>
        </div>
        <div class="panel-body" id="plannerResult">
          <div class="empty">
            <div class="emo">📐</div>
            <div class="ttl">${t('planner_result_empty_t')}</div>
            <div class="sub">${t('planner_result_empty_s')}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reference table -->
    <div class="panel" id="plannerScenariosPanel" style="display:none;">
      <div class="panel-head">
        <h3 data-i18n="planner_scenarios_t">${t('planner_scenarios_t')}</h3>
        <span class="muted" data-i18n="planner_scenarios_s">${t('planner_scenarios_s')}</span>
      </div>
      <div class="panel-body table-wrap" id="plannerScenarios"></div>
    </div>
  `;

  applyI18n(root);
  _bind(root);

  // Update live hint whenever quotes change
  _quoteUnsub = Quotes.subscribe(() => _updateHint(root));
}

export function unmount(root) {
  if (_quoteUnsub) { _quoteUnsub(); _quoteUnsub = null; }
  _lastSym = '';
  root.innerHTML = '';
}

/* ---- Bind ---- */

function _bind(root) {
  root.querySelector('#pTicker').addEventListener('input', (e) => {
    _lastSym = e.target.value.toUpperCase().trim();
    _updateHint(root);
    // Auto-fill entry if we have a quote and entry is empty
    const q = Quotes.getQuote(_lastSym);
    const entryEl = root.querySelector('#pEntry');
    if (q && q.price && !entryEl.value) {
      entryEl.value = q.price.toFixed(2);
    }
  });

  root.querySelector('#pCalc').addEventListener('click', () => _calculate(root));

  // Allow Enter to calculate
  root.querySelectorAll('#pEntry,#pStop,#pTarget,#pRisk').forEach(el => {
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter') _calculate(root); });
  });
}

function _updateHint(root) {
  if (!_lastSym) return;
  const q = Quotes.getQuote(_lastSym);
  const hint = root.querySelector('#pLiveHint');
  if (hint) hint.textContent = q && q.price ? t('planner_live_price', { price: q.price.toFixed(2) }) : '';
}

/* ---- Calculate ---- */

function _calculate(root) {
  const ticker = root.querySelector('#pTicker').value.trim().toUpperCase() || '—';
  const entry  = parseFloat(root.querySelector('#pEntry').value);
  const stop   = parseFloat(root.querySelector('#pStop').value);
  const target = parseFloat(root.querySelector('#pTarget').value);
  const risk   = parseFloat(root.querySelector('#pRisk').value);

  if (isNaN(entry) || isNaN(stop) || isNaN(risk) || entry <= 0 || stop <= 0 || risk <= 0) {
    toast(t('planner_invalid'), 'error'); return;
  }
  if (stop >= entry) {
    toast(t('planner_stop_above_entry'), 'error'); return;
  }

  const riskPerShare  = entry - stop;
  const shares        = Math.floor(risk / riskPerShare);
  const actualRisk    = shares * riskPerShare;
  const hasTarget     = !isNaN(target) && target > entry;
  const reward        = hasTarget ? shares * (target - entry) : null;
  const rr            = hasTarget ? ((target - entry) / riskPerShare) : null;

  const resultEl = root.querySelector('#plannerResult');
  resultEl.innerHTML = `
    <div class="planner-results">
      <div class="planner-ticker">${escapeHtml(ticker)}</div>

      <div class="planner-metric accent">
        <div class="lbl">${t('planner_size')}</div>
        <div class="val">${shares.toLocaleString()} <span class="unit">${t('planner_shares')}</span></div>
      </div>

      <div class="grid-2" style="gap:12px;">
        <div class="planner-metric">
          <div class="lbl">${t('planner_max_risk')}</div>
          <div class="val neg">$${actualRisk.toFixed(2)}</div>
          <div class="sub muted">${escapeHtml(entry.toFixed(2))} → ${escapeHtml(stop.toFixed(2))}</div>
        </div>
        ${hasTarget ? `
        <div class="planner-metric">
          <div class="lbl">${t('planner_reward')}</div>
          <div class="val pos">$${reward.toFixed(2)}</div>
          <div class="sub muted">${escapeHtml(entry.toFixed(2))} → ${escapeHtml(target.toFixed(2))}</div>
        </div>` : '<div class="planner-metric"><div class="lbl">' + t('planner_reward') + '</div><div class="val muted">—</div></div>'}
      </div>

      <div class="planner-rr ${rr != null ? (rr >= 2 ? 'good' : rr >= 1 ? 'ok' : 'bad') : ''}">
        <div class="lbl">${t('planner_rr')}</div>
        <div class="rr-val">${rr != null ? `1 : ${rr.toFixed(2)}` : '—'}</div>
        ${rr != null ? `<div class="rr-verdict">${rr >= 2 ? t('planner_rr_good') : rr >= 1 ? t('planner_rr_ok') : t('planner_rr_poor')}</div>` : ''}
      </div>

      <div class="planner-detail">
        <div class="row"><span>${t('planner_entry')}</span><span>$${escapeHtml(entry.toFixed(2))}</span></div>
        <div class="row"><span>${t('planner_stop')}</span><span class="neg">$${escapeHtml(stop.toFixed(2))}</span></div>
        ${hasTarget ? `<div class="row"><span>${t('planner_target')}</span><span class="pos">$${escapeHtml(target.toFixed(2))}</span></div>` : ''}
        <div class="row"><span>${t('planner_risk_per_share')}</span><span>$${escapeHtml(riskPerShare.toFixed(2))}</span></div>
        <div class="row"><span>${t('planner_total_position')}</span><span>$${(shares * entry).toFixed(2)}</span></div>
      </div>
    </div>
  `;

  // Build scenarios table (±5%, ±10%, ±15% moves from entry)
  _renderScenarios(root, { ticker, entry, stop, shares, risk });
}

function _renderScenarios(root, { ticker, entry, stop, shares, risk }) {
  const panel     = root.querySelector('#plannerScenariosPanel');
  const scenarios = root.querySelector('#plannerScenarios');
  panel.style.display = '';

  const moves = [-15, -10, -5, 5, 10, 15, 20, 30, 50];
  scenarios.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>${t('planner_move')}</th>
          <th>${t('planner_price')}</th>
          <th>${t('planner_pnl')}</th>
          <th>${t('planner_rr')}</th>
        </tr>
      </thead>
      <tbody>
        ${moves.map(pct => {
          const price  = entry * (1 + pct / 100);
          const pl     = (price - entry) * shares;
          const rr     = risk > 0 ? (pl / risk) : 0;
          const cls    = pl >= 0 ? 'pos' : 'neg';
          const stopRow = pct < 0 && price <= stop;
          return `
            <tr ${stopRow ? 'style="opacity:0.5;"' : ''}>
              <td class="${cls}" style="font-weight:600;">${pct > 0 ? '+' : ''}${pct}%</td>
              <td>$${price.toFixed(2)}</td>
              <td class="${cls}" style="font-weight:600;">${pl >= 0 ? '+' : ''}$${pl.toFixed(2)}</td>
              <td class="${cls}">${rr >= 0 ? '+' : ''}${rr.toFixed(2)}R ${stopRow ? '🛑' : ''}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}
