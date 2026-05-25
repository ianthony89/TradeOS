/* ============================================================
   TradeOS v4.0 — watchlist module
   Live render of the Watchlist sheet (synced via stores/watchlist.js).
   Read-only in Phase 3 — edits happen in the source sheet.
   ============================================================ */

import { t, applyI18n } from '../js/i18n.js';
import * as Watchlist from '../js/stores/watchlist.js';
import { escapeHtml } from '../js/domain/format.js';
import { mountSyncButton } from '../components/sync-button.js';

let _unsub = null;
let _syncUnmount = null;

export function mount(root) {
  root.innerHTML = `
    <div class="panel">
      <div class="panel-head">
        <h3 data-i18n="watchlist_title">${t('watchlist_title')}</h3>
        <div class="hstack">
          <span class="muted" id="wCount"></span>
          <span id="wSyncBtn"></span>
        </div>
      </div>
      <div class="panel-body" id="wBody"></div>
    </div>
  `;
  applyI18n(root);
  _render(root);
  _unsub = Watchlist.onChange(() => _render(root));
  _syncUnmount = mountSyncButton(root.querySelector('#wSyncBtn'));
}

export function unmount(root) {
  if (_unsub)       { _unsub(); _unsub = null; }
  if (_syncUnmount) { _syncUnmount(); _syncUnmount = null; }
  root.innerHTML = '';
}

function _render(root) {
  const items = Watchlist.getAll();
  const body  = root.querySelector('#wBody');
  const count = root.querySelector('#wCount');
  count.textContent = `${items.length} ${items.length === 1 ? t('item') : t('items')}`;

  if (!items.length) {
    body.innerHTML = `
      <div class="empty">
        <div class="emo">◯</div>
        <div class="ttl">${t('empty_watch_t')}</div>
        <div class="sub">${t('watchlist_empty_sub')}</div>
      </div>`;
    return;
  }

  body.innerHTML = items.map((w, i) => {
    const prio = String(w.priority || 'NORMAL').toUpperCase();
    const prioClass = prio.includes('HIGH') ? 'HIGH' : prio.includes('SPEC') ? 'SPECULATIVE' : 'NORMAL';
    const prioLabel = prioClass === 'HIGH' ? t('prio_high') : prioClass === 'SPECULATIVE' ? t('prio_spec') : t('prio_normal');
    const urg = String(w.urgency || 'LOW').toUpperCase();
    return `
      <div class="watch-item" style="animation: viewIn 320ms var(--ease-out) ${i * 30}ms backwards;">
        <div class="head">
          <div class="ttl">${escapeHtml(w.ticker)}</div>
          <div class="priority-${prioClass}" style="font-size:10px;font-weight:800;letter-spacing:1.4px;">${escapeHtml(prioLabel)}</div>
        </div>
        ${w.catalyst ? `<div class="note"><b>${t('label_catalyst')}:</b> ${escapeHtml(w.catalyst)}</div>` : ''}
        ${w.note     ? `<div class="note">${escapeHtml(w.note)}</div>` : ''}
        <div class="meta">
          <span class="badge badge-${escapeHtml(w.risk || 'TACTICAL')}">${escapeHtml(w.risk || 'TACTICAL')}</span>
          <span class="badge badge-WATCH" title="${t('label_urgency')}">${escapeHtml(urg)}</span>
          ${w.added ? `<span class="muted">${t('added')} ${escapeHtml(String(w.added).slice(0, 10))}</span>` : ''}
        </div>
      </div>`;
  }).join('');
}
