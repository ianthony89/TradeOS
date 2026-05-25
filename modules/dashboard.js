/* ============================================================
   TradeOS v4.0 — dashboard module
   Stats grid → threats + risk gauge → allocation/risk charts
   → heatmap + movers → P/L by position bars.
   Subscribes to state.onChange + storage settings updates.
   ============================================================ */

import { t, applyI18n } from '../js/i18n.js';
import { getSettings, saveSettings } from '../js/storage.js';
import * as Holdings  from '../js/stores/holdings.js';
import * as Watchlist from '../js/stores/watchlist.js';
import * as Router from '../js/router.js';
import { getStats, applyMarketFilter, topMovers } from '../js/domain/portfolio.js';
import { detectThreats } from '../js/domain/threats.js';
import { fmt, escapeHtml } from '../js/domain/format.js';
import { renderDonut } from '../js/charts/donut.js';
import { renderBars }  from '../js/charts/bars.js';
import { renderPLBars } from '../js/charts/plbars.js';
import { renderHeatmap } from '../js/charts/heatmap.js';
import { renderThreats } from '../components/threats.js';
import { mountSyncButton } from '../components/sync-button.js';

let _unsubs = [];
let _resizeTimer = null;
let _onResize = null;
let _chartCleanups = [];

const ICONS = {
  wallet:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="14" rx="3"/><path d="M16 12h4"/></svg>',
  trending: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
  shield:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  dollar:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6"/></svg>',
};

export function mount(root) {
  root.innerHTML = `
    <div class="hstack" style="margin-bottom:14px; justify-content: space-between;">
      <div class="market-filter" role="tablist" id="dashMarketFilter">
        <div class="mf" data-f="ALL">${t('mf_all')}</div>
        <div class="mf" data-f="US">${t('mf_us')}</div>
        <div class="mf" data-f="MY">${t('mf_my')}</div>
      </div>
      <div id="dashSyncBtn"></div>
    </div>

    <div class="stats" id="statsRow"></div>

    <div class="panel">
      <div class="panel-head">
        <h3 data-i18n="threats_title">${t('threats_title')}</h3>
        <span class="muted" id="threatCount">0 ${t('signals')}</span>
      </div>
      <div class="panel-body" id="threatsBody"></div>
    </div>

    <div class="grid-2">
      <div class="panel">
        <div class="panel-head">
          <h3 data-i18n="chart_alloc">${t('chart_alloc')}</h3>
          <span class="muted" data-i18n="chart_alloc_sub">${t('chart_alloc_sub')}</span>
        </div>
        <div class="panel-body">
          <div class="chart-wrap"><canvas id="cDonut"></canvas><div class="chart-tooltip" id="cDonutTip"></div></div>
          <div class="legend" id="cDonutLegend"></div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head">
          <h3 data-i18n="chart_risk">${t('chart_risk')}</h3>
          <span class="muted" data-i18n="chart_risk_sub">${t('chart_risk_sub')}</span>
        </div>
        <div class="panel-body">
          <div class="chart-wrap"><canvas id="cBars"></canvas></div>
          <div class="legend" id="cBarsLegend"></div>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="panel">
        <div class="panel-head">
          <h3 data-i18n="chart_heatmap">${t('chart_heatmap')}</h3>
          <span class="muted" data-i18n="chart_heatmap_sub">${t('chart_heatmap_sub')}</span>
        </div>
        <div class="panel-body" id="cHeatmap"></div>
      </div>
      <div class="panel">
        <div class="panel-head">
          <h3 data-i18n="chart_movers">${t('chart_movers')}</h3>
          <span class="muted" data-i18n="chart_movers_sub">${t('chart_movers_sub')}</span>
        </div>
        <div class="panel-body" id="cMovers"></div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h3 data-i18n="chart_pl">${t('chart_pl')}</h3>
        <span class="muted" data-i18n="chart_pl_sub">${t('chart_pl_sub')}</span>
      </div>
      <div class="panel-body">
        <div class="plchart" id="cPL"></div>
      </div>
    </div>
  `;

  applyI18n(root);
  _bindFilter(root);
  _renderAll(root);

  // Manual sync button in the toolbar.
  _unsubs.push(mountSyncButton(root.querySelector('#dashSyncBtn')));

  // Re-render when any synced store changes.
  _unsubs.push(Holdings.onChange(() => _renderAll(root)));
  _unsubs.push(Watchlist.onChange(() => _renderAll(root)));

  // Re-render on viewport resize (sidebar collapse → wider charts).
  // Debounced. Observed at the window level, not on the root, to avoid
  // a ResizeObserver feedback loop with our own innerHTML updates.
  _onResize = () => {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(() => _renderAll(root), 140);
  };
  window.addEventListener('resize', _onResize);
}

export function unmount(root) {
  _unsubs.forEach(fn => { try { fn(); } catch (e) {} });
  _unsubs = [];
  if (_onResize) { window.removeEventListener('resize', _onResize); _onResize = null; }
  clearTimeout(_resizeTimer);
  _disposeCharts();
  root.innerHTML = '';
}

function _disposeCharts() {
  _chartCleanups.forEach(fn => { try { fn(); } catch (e) {} });
  _chartCleanups = [];
}

function _bindFilter(root) {
  const filterEl = root.querySelector('#dashMarketFilter');
  const current = getSettings().marketFilter || 'ALL';
  filterEl.querySelectorAll('.mf').forEach(mf => {
    if (mf.dataset.f === current) mf.classList.add('active');
    mf.addEventListener('click', () => {
      const f = mf.dataset.f;
      filterEl.querySelectorAll('.mf').forEach(m => m.classList.toggle('active', m === mf));
      saveSettings({ marketFilter: f });
      _renderAll(root);
    });
  });
}

function _renderAll(root) {
  _disposeCharts();
  const settings = getSettings();
  const all = Holdings.getAll();
  const list = applyMarketFilter(all, settings.marketFilter);

  _renderStats(root, list, settings);
  _renderThreats(root, list, settings);
  _renderCharts(root, list);
  _renderMovers(root, list);
}

function _renderStats(root, list, settings) {
  const stats = getStats(list, settings);
  const cashSet = stats.cash > 0;
  const grid = root.querySelector('#statsRow');

  const items = [
    {
      label: cashSet ? t('stat_portfolio') : t('stat_holdings_value'),
      value: fmt.usd(stats.portfolio),
      sub:   cashSet ? '' : `<span class="muted">${t('holdings_only')}</span>`,
      icon:  ICONS.wallet,
      accent: true,
    },
    {
      label: t('stat_pl'),
      value: fmt.usd(stats.totalPL),
      sub:   `<span class="delta-pill ${stats.totalPL >= 0 ? 'pos' : 'neg'}">${fmt.pct(stats.totalPLPct)}</span>`,
      icon:  ICONS.trending,
    },
    {
      label: t('stat_risk'),
      value: `${stats.riskPct.toFixed(1)}%`,
      sub:   `Lev ${stats.levPct.toFixed(1)}% · Spec ${stats.specPct.toFixed(1)}%`,
      icon:  ICONS.shield,
    },
    {
      label: t('stat_cash'),
      value: cashSet ? fmt.usd(stats.cash) : `<span class="muted" style="font-size:14px;font-weight:600;">${t('not_available')}</span>`,
      sub:   cashSet ? '' : `<span class="muted">${t('set_in_settings')}</span>`,
      icon:  ICONS.dollar,
    },
    {
      label: t('stat_winners'),
      value: String(stats.winners),
      sub:   `<span class="delta-pill pos">${list.length ? Math.round(stats.winners / list.length * 100) : 0}% ${t('of_book')}</span>`,
    },
    {
      label: t('stat_losers'),
      value: String(stats.losers),
      sub:   `<span class="delta-pill neg">${list.length ? Math.round(stats.losers / list.length * 100) : 0}% ${t('of_book')}</span>`,
    },
    {
      label: t('stat_positions'),
      value: String(list.length),
      sub:   t('across_strategies'),
    },
    {
      label: t('stat_watchlist'),
      value: String(Watchlist.getAll().length),
      sub:   t('tracking_ops'),
    },
  ];

  grid.innerHTML = items.map((it, i) => `
    <div class="stat ${it.accent ? 'accent' : ''}" style="animation: viewIn 380ms var(--ease-out) ${i * 40}ms backwards;">
      <div class="stat-head">
        <div class="lbl">${it.label}</div>
        ${it.icon ? `<span class="stat-ico">${it.icon}</span>` : ''}
      </div>
      <div class="val">${it.value}</div>
      <div class="sub">${it.sub || ''}</div>
    </div>
  `).join('');
}

function _renderThreats(root, list, settings) {
  const body = root.querySelector('#threatsBody');
  const countEl = root.querySelector('#threatCount');
  const result = detectThreats(list, settings);
  renderThreats(body, countEl, result, list.length > 0);
}

function _renderCharts(root, list) {
  const donutCanvas = root.querySelector('#cDonut');
  const donutTip    = root.querySelector('#cDonutTip');
  const donutLegend = root.querySelector('#cDonutLegend');
  const barsCanvas  = root.querySelector('#cBars');
  const barsLegend  = root.querySelector('#cBarsLegend');
  const heatRoot    = root.querySelector('#cHeatmap');
  const plRoot      = root.querySelector('#cPL');

  _chartCleanups.push(renderDonut(donutCanvas, donutLegend, donutTip, list));
  _chartCleanups.push(renderBars(barsCanvas, barsLegend, list));
  _chartCleanups.push(renderHeatmap(heatRoot, list, {
    onClickTile: (sym) => Router.go('holdings'),
  }));
  _chartCleanups.push(renderPLBars(plRoot, list, {
    onClickRow: (sym) => Router.go('holdings'),
  }));
}

function _renderMovers(root, list) {
  const body = root.querySelector('#cMovers');
  if (!list.length) {
    body.innerHTML = `<div class="empty"><div class="emo">↑↓</div><div class="ttl">${t('chart_movers')}</div><div class="sub">${t('empty_holdings_s')}</div></div>`;
    return;
  }
  const { winners, losers } = topMovers(list, 3);
  body.innerHTML = `
    <div style="display:grid;gap:14px;">
      <div>
        <div class="muted" style="margin-bottom:8px;font-weight:700;letter-spacing:1.4px;color:var(--green);">${t('top_winners')}</div>
        ${winners.map(_moverRow).join('')}
      </div>
      <div>
        <div class="muted" style="margin-bottom:8px;font-weight:700;letter-spacing:1.4px;color:var(--red);">${t('top_losers')}</div>
        ${losers.map(_moverRow).join('')}
      </div>
    </div>`;
  body.querySelectorAll('.mover-row').forEach(el => {
    el.addEventListener('click', () => Router.go('holdings'));
  });
}

function _moverRow(h) {
  return `
    <div class="mover-row" data-sym="${escapeHtml(h.symbol)}">
      <span class="sym"><span class="sym-ico">${escapeHtml(h.symbol.slice(0, 4))}</span>${escapeHtml(h.symbol)}</span>
      <span class="right">
        <div class="pct ${h.plUSD >= 0 ? 'pos' : 'neg'}">${fmt.pct(h.plPct)}</div>
        <div class="usd">${fmt.usd(h.plUSD)}</div>
      </span>
    </div>`;
}
