/* ============================================================
   TradeOS v4.0 — performance module (Phase 5)
   Portfolio performance analytics derived from holdings +
   journal. All metrics are computed client-side from cached
   store data — no additional API calls.

   Metrics:
     • Unrealized P/L, win rate, avg gain/loss, expectancy,
       profit factor, max drawdown, best/worst trade.
     • Journal stats: trade counts, action breakdown,
       monthly activity heatmap.
   ============================================================ */

import { t, applyI18n } from '../js/i18n.js';
import * as Holdings from '../js/stores/holdings.js';
import * as Journal  from '../js/stores/journal.js';
import { getStats }  from '../js/domain/portfolio.js';
import { getSettings } from '../js/storage.js';
import { fmt, escapeHtml } from '../js/domain/format.js';
import { mountSyncButton } from '../components/sync-button.js';

let _unsubs = [];
let _syncUnmount = null;

export function mount(root) {
  root.innerHTML = `
    <div class="panel">
      <div class="panel-head">
        <h3 data-i18n="perf_title">${t('perf_title')}</h3>
        <span id="perfSyncBtn"></span>
      </div>
      <div class="panel-body">
        <div class="stats" id="perfStats"></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="panel">
        <div class="panel-head">
          <h3 data-i18n="perf_win_loss_chart">${t('perf_win_loss_chart')}</h3>
          <span class="muted" data-i18n="perf_by_position">${t('perf_by_position')}</span>
        </div>
        <div class="panel-body" id="perfWinLoss"></div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h3 data-i18n="perf_top_gainers_t">${t('perf_top_gainers_t')}</h3>
          <span class="muted" data-i18n="perf_by_pct">${t('perf_by_pct')}</span>
        </div>
        <div class="panel-body" id="perfLeaders"></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="panel">
        <div class="panel-head">
          <h3 data-i18n="perf_journal_stats">${t('perf_journal_stats')}</h3>
          <span class="muted" data-i18n="perf_from_log">${t('perf_from_log')}</span>
        </div>
        <div class="panel-body" id="perfJournal"></div>
      </div>
      <div class="panel">
        <div class="panel-head">
          <h3 data-i18n="perf_monthly_t">${t('perf_monthly_t')}</h3>
          <span class="muted" data-i18n="perf_trade_frequency">${t('perf_trade_frequency')}</span>
        </div>
        <div class="panel-body" id="perfMonthly"></div>
      </div>
    </div>
  `;

  applyI18n(root);
  _render(root);

  _syncUnmount = mountSyncButton(root.querySelector('#perfSyncBtn'));
  _unsubs.push(Holdings.onChange(() => _render(root)));
  _unsubs.push(Journal.onChange(() => _render(root)));
}

export function unmount(root) {
  _unsubs.forEach(fn => { try { fn(); } catch (e) {} });
  _unsubs = [];
  if (_syncUnmount) { _syncUnmount(); _syncUnmount = null; }
  root.innerHTML = '';
}

/* ---- Render ---- */

function _render(root) {
  const holdings = Holdings.getAll();
  const journal  = Journal.getAll();
  const settings = getSettings();

  _renderStats(root, holdings, settings);
  _renderWinLoss(root, holdings);
  _renderLeaders(root, holdings);
  _renderJournal(root, journal);
  _renderMonthly(root, journal);
}

function _renderStats(root, holdings, settings) {
  const el = root.querySelector('#perfStats');
  if (!holdings.length) {
    el.innerHTML = `<div class="empty" style="padding:30px;grid-column:1/-1;"><div class="emo">📊</div><div class="ttl">${t('perf_empty_t')}</div><div class="sub">${t('perf_empty_s')}</div></div>`;
    return;
  }

  const stats   = getStats(holdings, settings);
  const gainers = holdings.filter(h => h.plUSD > 0);
  const losers  = holdings.filter(h => h.plUSD < 0);
  const winRate = holdings.length > 0 ? (gainers.length / holdings.length) * 100 : 0;
  const avgGain = gainers.length ? gainers.reduce((a, h) => a + h.plPct, 0) / gainers.length : 0;
  const avgLoss = losers.length  ? losers.reduce((a, h) => a + h.plPct, 0) / losers.length : 0;
  const expectancy = (winRate / 100) * avgGain + ((100 - winRate) / 100) * avgLoss;

  const sumGains  = gainers.reduce((a, h) => a + h.plUSD, 0);
  const sumLosses = Math.abs(losers.reduce((a, h) => a + h.plUSD, 0));
  const profitFactor = sumLosses > 0 ? (sumGains / sumLosses).toFixed(2) : sumGains > 0 ? '∞' : '0.00';

  const sorted = [...holdings].sort((a, b) => b.plPct - a.plPct);
  const best   = sorted[0]  || null;
  const worst  = sorted[sorted.length - 1] || null;

  const metrics = [
    { label: t('perf_unrealized_pl'), value: fmt.usd(stats.totalPL),     cls: stats.totalPL >= 0 ? 'pos' : 'neg', accent: true },
    { label: t('perf_win_rate'),      value: `${winRate.toFixed(1)}%`,    sub: `${gainers.length}W / ${losers.length}L` },
    { label: t('perf_avg_gain'),      value: `+${avgGain.toFixed(2)}%`,   cls: 'pos' },
    { label: t('perf_avg_loss'),      value: `${avgLoss.toFixed(2)}%`,    cls: 'neg' },
    { label: t('perf_expectancy'),    value: `${expectancy >= 0 ? '+' : ''}${expectancy.toFixed(2)}%`,
                                                                           cls: expectancy >= 0 ? 'pos' : 'neg' },
    { label: t('perf_profit_factor'), value: `${profitFactor}x` },
    { label: t('perf_best_trade'),    value: best  ? `${best.symbol}` : '—',
                                      sub: best  ? `+${best.plPct.toFixed(2)}% · ${fmt.usd(best.plUSD)}`  : '' },
    { label: t('perf_worst_trade'),   value: worst ? `${worst.symbol}` : '—',
                                      sub: worst ? `${worst.plPct.toFixed(2)}% · ${fmt.usd(worst.plUSD)}` : '' },
  ];

  el.innerHTML = metrics.map((m, i) => `
    <div class="stat ${m.accent ? 'accent' : ''}" style="animation: viewIn 320ms var(--ease-out) ${i * 30}ms backwards;">
      <div class="stat-head"><div class="lbl">${escapeHtml(m.label)}</div></div>
      <div class="val ${m.cls || ''}" style="font-size:20px;">${m.value}</div>
      ${m.sub ? `<div class="sub">${escapeHtml(m.sub)}</div>` : ''}
    </div>
  `).join('');
}

function _renderWinLoss(root, holdings) {
  const el = root.querySelector('#perfWinLoss');
  if (!holdings.length) { el.innerHTML = _emptyBlock(); return; }

  const gainers = holdings.filter(h => h.plUSD > 0);
  const losers  = holdings.filter(h => h.plUSD < 0);
  const flat    = holdings.filter(h => h.plUSD === 0);
  const total   = holdings.length;

  const bar = (count, total, cls) => {
    const pct = total > 0 ? Math.max(2, (count / total) * 100) : 0;
    return `<div class="wl-bar ${cls}" style="flex:${pct}"></div>`;
  };

  el.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:18px;">
      <div class="wl-legend">
        <span class="wl-dot pos"></span>${t('perf_winners_label')} <b>${gainers.length}</b>
        <span class="wl-dot neg" style="margin-left:14px;"></span>${t('perf_losers_label')} <b>${losers.length}</b>
        ${flat.length ? `<span class="wl-dot neutral" style="margin-left:14px;"></span>${t('perf_flat_label')} <b>${flat.length}</b>` : ''}
      </div>
      <div class="wl-bars">
        ${bar(gainers.length, total, 'pos')}
        ${flat.length ? bar(flat.length, total, 'neutral') : ''}
        ${bar(losers.length, total, 'neg')}
      </div>
      <div style="display:grid;gap:10px;">
        ${holdings.sort((a,b) => b.plPct - a.plPct).slice(0,6).map(h => `
          <div class="perf-row">
            <span class="sym"><span class="sym-ico">${escapeHtml(h.symbol.slice(0,4))}</span>${escapeHtml(h.symbol)}</span>
            <div class="perf-bar-wrap">
              <div class="perf-bar ${h.plUSD >= 0 ? 'pos' : 'neg'}" style="width:${Math.min(100,Math.abs(h.plPct) * 1.5)}%"></div>
            </div>
            <span class="${h.plUSD >= 0 ? 'pos' : 'neg'}" style="font-size:12px;font-weight:700;min-width:60px;text-align:right;">
              ${h.plPct >= 0 ? '+' : ''}${h.plPct.toFixed(2)}%
            </span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function _renderLeaders(root, holdings) {
  const el = root.querySelector('#perfLeaders');
  if (!holdings.length) { el.innerHTML = _emptyBlock(); return; }

  const sorted = [...holdings].sort((a, b) => b.plUSD - a.plUSD);

  el.innerHTML = `
    <div style="display:grid;gap:10px;">
      ${sorted.slice(0, 8).map((h, i) => `
        <div class="perf-leader-row" style="animation: viewIn 280ms var(--ease-out) ${i * 25}ms backwards;">
          <span class="rank">${i + 1}</span>
          <span class="sym"><span class="sym-ico">${escapeHtml(h.symbol.slice(0,4))}</span>${escapeHtml(h.symbol)}</span>
          <div style="flex:1;min-width:0;">
            <div class="${h.plUSD >= 0 ? 'pos' : 'neg'}" style="font-weight:700;font-size:13px;">
              ${h.plUSD >= 0 ? '+' : ''}${fmt.usd(h.plUSD)}
            </div>
            <div class="muted" style="font-size:11px;">${h.plPct >= 0 ? '+' : ''}${h.plPct.toFixed(2)}%  ·  ${fmt.usd(h.marketValue)} MV</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function _renderJournal(root, entries) {
  const el = root.querySelector('#perfJournal');
  if (!entries.length) {
    el.innerHTML = `<div class="empty" style="padding:20px;"><div class="emo">📓</div><div class="ttl">${t('perf_no_journal')}</div><div class="sub">${t('perf_no_journal_s')}</div></div>`;
    return;
  }

  const counts = { BUY: 0, SELL: 0, TRIM: 0, ADD: 0, OTHER: 0 };
  entries.forEach(e => {
    const a = String(e.action || '').toUpperCase();
    counts[counts[a] !== undefined ? a : 'OTHER']++;
  });

  const tickers = [...new Set(entries.map(e => e.ticker).filter(Boolean))];
  const mostTraded = _mostFrequent(entries.map(e => e.ticker).filter(Boolean));

  el.innerHTML = `
    <div class="perf-journal-grid">
      <div class="pj-stat"><div class="lbl">${t('perf_total_trades')}</div><div class="val">${entries.length}</div></div>
      <div class="pj-stat"><div class="lbl">${t('perf_unique_tickers')}</div><div class="val">${tickers.length}</div></div>
      <div class="pj-stat"><div class="lbl">${t('perf_buy_count')}</div><div class="val pos">${counts.BUY + counts.ADD}</div></div>
      <div class="pj-stat"><div class="lbl">${t('perf_sell_count')}</div><div class="val neg">${counts.SELL + counts.TRIM}</div></div>
    </div>
    <div style="margin-top:16px;">
      <div class="muted" style="font-size:10px;letter-spacing:1.6px;text-transform:uppercase;font-weight:700;margin-bottom:10px;">${t('perf_action_breakdown')}</div>
      ${Object.entries(counts).filter(([,v]) => v > 0).map(([k, v]) => `
        <div class="action-bar-row">
          <span class="action-label">${escapeHtml(k)}</span>
          <div class="action-bar-wrap">
            <div class="action-bar action-${k.toLowerCase()}" style="width:${Math.max(4,(v/entries.length)*100)}%"></div>
          </div>
          <span class="action-count">${v}</span>
        </div>
      `).join('')}
    </div>
    ${mostTraded ? `<div style="margin-top:14px;" class="muted" style="font-size:12px;">${t('perf_most_traded')}: <strong style="color:var(--text);">${escapeHtml(mostTraded)}</strong></div>` : ''}
  `;
}

function _renderMonthly(root, entries) {
  const el = root.querySelector('#perfMonthly');
  if (!entries.length) { el.innerHTML = `<div class="empty" style="padding:20px;"><div class="emo">📅</div><div class="ttl">${t('perf_no_journal')}</div></div>`; return; }

  // Group by YYYY-MM
  const monthly = {};
  entries.forEach(e => {
    const d = String(e.date || '');
    if (d.length < 7) return;
    const ym = d.slice(0, 7); // YYYY-MM
    monthly[ym] = (monthly[ym] || 0) + 1;
  });

  const months = Object.keys(monthly).sort();
  if (!months.length) { el.innerHTML = _emptyBlock(); return; }

  const maxCount = Math.max(...Object.values(monthly));

  el.innerHTML = `
    <div class="monthly-grid">
      ${months.slice(-18).map(ym => {
        const count = monthly[ym];
        const intensity = maxCount > 0 ? count / maxCount : 0;
        return `
          <div class="month-cell" style="--intensity:${intensity.toFixed(2)};" title="${ym}: ${count} ${count === 1 ? t('entry') : t('entries')}">
            <div class="month-label">${ym.slice(5)}</div>
            <div class="month-count">${count}</div>
          </div>
        `;
      }).join('')}
    </div>
    <div class="muted" style="font-size:11px;margin-top:10px;text-align:center;">${t('perf_monthly_legend')}</div>
  `;
}

/* ---- Utility ---- */

function _emptyBlock() {
  return `<div class="empty" style="padding:20px;"><div class="emo">—</div><div class="ttl">${t('perf_empty_t')}</div></div>`;
}

function _mostFrequent(arr) {
  if (!arr.length) return null;
  const freq = {};
  arr.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}
