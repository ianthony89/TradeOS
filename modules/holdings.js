/* ============================================================
   TradeOS v4.0 — holdings module
   Sortable table with filters + ticker search; manual add row;
   demo data + clear all. Per-row remove. Subscribes to state.
   ============================================================ */

import { t, applyI18n } from '../js/i18n.js';
import { getSettings } from '../js/storage.js';
import * as State from '../js/state.js';
import { applyMarketFilter } from '../js/domain/portfolio.js';
import { classifyRisk, RISK_CLASSES } from '../js/domain/risk.js';
import { fmt, escapeHtml } from '../js/domain/format.js';
import { toast } from '../js/toast.js';

const STATUSES = ['HEALTHY','WATCH','WEAK','DEAD'];

let _stateUnsub = null;
let _sortCol = 'marketValue';
let _sortDir = -1;             // -1 desc, +1 asc
let _search = '';
let _fRisk = '';
let _fStatus = '';

export function mount(root) {
  root.innerHTML = `
    <div class="panel">
      <div class="panel-head">
        <h3 data-i18n="holdings_title">${t('holdings_title')}</h3>
        <div class="toolbar">
          <input type="text" class="input-sm" id="hSearch" placeholder="${escapeHtml(t('filter_ticker'))}" value="${escapeHtml(_search)}"/>
          <select id="hRisk" class="input-sm">
            <option value="">${t('filter_all_risk')}</option>
            ${RISK_CLASSES.map(r => `<option ${_fRisk === r ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
          <select id="hStatus" class="input-sm">
            <option value="">${t('filter_all_status')}</option>
            ${STATUSES.map(s => `<option ${_fStatus === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
          <button class="btn sm ghost danger" id="hClear" data-i18n="clear_all">${t('clear_all')}</button>
        </div>
      </div>
      <div class="panel-body table-wrap" id="hTableBody"></div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h3 data-i18n="btn_manual">${t('btn_manual')}</h3>
        <button class="btn sm" id="hDemo" data-i18n="btn_demo">${t('btn_demo')}</button>
      </div>
      <div class="panel-body">
        <div class="form-row">
          <div class="form-grid-2">
            <div>
              <label data-i18n="label_symbol">${t('label_symbol')}</label>
              <input type="text" id="aSym" placeholder="NVDA"/>
            </div>
            <div>
              <label data-i18n="label_qty">${t('label_qty')}</label>
              <input type="number" id="aQty" min="0" step="any"/>
            </div>
          </div>
          <div class="form-grid-2">
            <div>
              <label data-i18n="label_avg_usd">${t('label_avg_usd')}</label>
              <input type="number" id="aAvg" min="0" step="any"/>
            </div>
            <div>
              <label data-i18n="label_last_usd">${t('label_last_usd')}</label>
              <input type="number" id="aLast" min="0" step="any"/>
            </div>
          </div>
          <div>
            <label data-i18n="label_currency">${t('label_currency')}</label>
            <select id="aCcy">
              <option value="USD">USD</option>
              <option value="MYR">MYR</option>
              <option value="HKD">HKD</option>
              <option value="SGD">SGD</option>
              <option value="CNY">CNY</option>
            </select>
          </div>
          <div><button class="btn primary" id="hAdd" data-i18n="btn_add_pos">${t('btn_add_pos')}</button></div>
        </div>
      </div>
    </div>
  `;

  applyI18n(root);
  _bind(root);
  _renderTable(root);
  _stateUnsub = State.onChange(() => _renderTable(root));
}

export function unmount(root) {
  if (_stateUnsub) { _stateUnsub(); _stateUnsub = null; }
  root.innerHTML = '';
}

function _bind(root) {
  root.querySelector('#hSearch').addEventListener('input', (e) => {
    _search = e.target.value.toUpperCase();
    _renderTable(root);
  });
  root.querySelector('#hRisk').addEventListener('change', (e) => {
    _fRisk = e.target.value;
    _renderTable(root);
  });
  root.querySelector('#hStatus').addEventListener('change', (e) => {
    _fStatus = e.target.value;
    _renderTable(root);
  });
  root.querySelector('#hClear').addEventListener('click', () => {
    if (!State.getHoldings().length) return;
    if (!confirm(t('confirm_clear_holdings'))) return;
    State.clearAll();
    toast(t('toast_cleared'), 'info');
  });
  root.querySelector('#hDemo').addEventListener('click', () => {
    State.setHoldings(_demoData());
    toast(t('toast_sample_loaded'), 'success');
  });
  root.querySelector('#hAdd').addEventListener('click', () => _handleAdd(root));
}

function _handleAdd(root) {
  const symbol = root.querySelector('#aSym').value.trim().toUpperCase();
  const qty       = parseFloat(root.querySelector('#aQty').value);
  const avgCost   = parseFloat(root.querySelector('#aAvg').value);
  const lastPrice = parseFloat(root.querySelector('#aLast').value);
  const currency  = root.querySelector('#aCcy').value;
  if (!symbol || !qty) { toast(t('toast_sym_req'), 'error'); return; }
  const existing = State.getRawHoldings().find(h => h.symbol === symbol);
  State.upsertHolding({ symbol, qty, avgCost, lastPrice, currency, risk: classifyRisk(symbol) });
  ['#aSym','#aQty','#aAvg','#aLast'].forEach(id => { root.querySelector(id).value = ''; });
  toast(`${symbol} ${existing ? t('toast_updated') : t('toast_added')}`, 'success');
}

function _renderTable(root) {
  const body = root.querySelector('#hTableBody');
  const all = State.getHoldings();
  if (!all.length) {
    body.innerHTML = `
      <div class="empty" style="padding:40px 24px;">
        <div class="emo">◇</div>
        <div class="ttl">${t('empty_holdings_t')}</div>
        <div class="sub">${t('empty_holdings_s')}</div>
      </div>`;
    return;
  }

  const list = applyMarketFilter(all, getSettings().marketFilter)
    .filter(h =>
      (!_search || h.symbol.toUpperCase().includes(_search)) &&
      (!_fRisk || h.risk === _fRisk) &&
      (!_fStatus || h.status === _fStatus)
    );

  list.sort((a, b) => {
    const av = a[_sortCol], bv = b[_sortCol];
    if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * _sortDir;
    return (((av || 0) - (bv || 0))) * _sortDir;
  });

  const cols = [
    { k: 'symbol',      l: t('col_symbol') },
    { k: 'qty',         l: t('col_qty')    },
    { k: 'avgCost',     l: t('col_avg')    },
    { k: 'lastPrice',   l: t('col_last')   },
    { k: 'marketValue', l: t('col_mv')     },
    { k: 'plUSD',       l: t('col_pl_usd') },
    { k: 'plPct',       l: t('col_pl_pct') },
    { k: 'risk',        l: t('col_risk')   },
    { k: 'status',      l: t('col_status') },
    { k: 'action',      l: t('col_action') },
    { k: '__row',       l: '' },
  ];

  body.innerHTML = `
    <table>
      <thead>
        <tr>
          ${cols.map(c =>
            c.k === '__row'
              ? `<th style="width:40px"></th>`
              : `<th data-sort="${c.k}" class="${_sortCol === c.k ? 'sorted' : ''}">${escapeHtml(c.l)}<span class="sort-ind">${_sortCol === c.k ? (_sortDir === -1 ? '▼' : '▲') : '⇅'}</span></th>`
          ).join('')}
        </tr>
      </thead>
      <tbody>
        ${list.length === 0
          ? `<tr><td colspan="${cols.length}"><div class="empty" style="padding:30px;"><div class="ttl">${t('empty_matches_t')}</div><div class="sub">${t('empty_matches_s')}</div></div></td></tr>`
          : list.map((h, i) => `
            <tr data-sym="${escapeHtml(h.symbol)}" style="animation: viewIn 280ms var(--ease-out) ${i * 16}ms backwards;">
              <td><span class="sym"><span class="sym-ico">${escapeHtml(h.symbol.slice(0, 4))}</span>${escapeHtml(h.symbol)}</span></td>
              <td>${fmt.num(h.qty)}</td>
              <td>${fmt.usd(h.avgCost)}</td>
              <td>${fmt.usd(h.lastPrice)}</td>
              <td>${fmt.usd(h.marketValue)}</td>
              <td class="${h.plUSD >= 0 ? 'pos' : 'neg'}" style="font-weight:600;">${fmt.usd(h.plUSD)}</td>
              <td class="${h.plPct >= 0 ? 'pos' : 'neg'}" style="font-weight:600;">${fmt.pct(h.plPct)}</td>
              <td><span class="badge badge-${h.risk}">${h.risk}</span></td>
              <td><span class="badge badge-${h.status}">${h.status}</span></td>
              <td><span class="badge badge-${h.action}">${h.action}</span></td>
              <td><button class="row-action" data-remove="${escapeHtml(h.symbol)}" title="Remove">✕</button></td>
            </tr>`).join('')}
      </tbody>
    </table>
  `;

  // Sort handlers
  body.querySelectorAll('thead th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const k = th.dataset.sort;
      if (_sortCol === k) _sortDir = -_sortDir;
      else { _sortCol = k; _sortDir = -1; }
      _renderTable(root);
    });
  });
  // Per-row remove
  body.querySelectorAll('button[data-remove]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const sym = btn.dataset.remove;
      if (!confirm(t('confirm_remove_pos', { sym }))) return;
      State.removeHolding(sym);
      toast(`${sym} ${t('toast_removed')}`, 'info');
    });
  });
}

/* ---------- Demo data (ported from v3.7 loadSampleData) ---------- */
function _demoData() {
  return [
    { symbol: 'NVDA',  qty: 50,  avgCost: 480,  lastPrice: 920 },
    { symbol: 'AAPL',  qty: 80,  avgCost: 175,  lastPrice: 225 },
    { symbol: 'TSLA',  qty: 30,  avgCost: 240,  lastPrice: 195 },
    { symbol: 'AMD',   qty: 60,  avgCost: 140,  lastPrice: 165 },
    { symbol: 'TQQQ',  qty: 100, avgCost: 55,   lastPrice: 78  },
    { symbol: 'SOXL',  qty: 40,  avgCost: 42,   lastPrice: 28  },
    { symbol: 'PLTR',  qty: 300, avgCost: 18,   lastPrice: 25  },
    { symbol: 'MSFT',  qty: 25,  avgCost: 380,  lastPrice: 430 },
    { symbol: 'GOOGL', qty: 35,  avgCost: 140,  lastPrice: 175 },
    { symbol: 'SMCI',  qty: 15,  avgCost: 850,  lastPrice: 520 },
    { symbol: 'COIN',  qty: 20,  avgCost: 180,  lastPrice: 225 },
    { symbol: 'META',  qty: 18,  avgCost: 340,  lastPrice: 485 },
    { symbol: '5555',  qty: 200, avgCost: 1.84, lastPrice: 1.81, currency: 'MYR', name: 'SUNMED' },
  ];
}
