/* ============================================================
   TradeOS v4.0 — journal module
   Live render of the Journal sheet (synced via stores/journal.js).
   Read-only in Phase 3 — edits happen in the source sheet.
   ============================================================ */

import { t, applyI18n } from '../js/i18n.js';
import * as Journal from '../js/stores/journal.js';
import { escapeHtml } from '../js/domain/format.js';
import { mountSyncButton } from '../components/sync-button.js';

let _unsub = null;
let _syncUnmount = null;

export function mount(root) {
  root.innerHTML = `
    <div class="panel">
      <div class="panel-head">
        <h3 data-i18n="journal_title">${t('journal_title')}</h3>
        <div class="hstack">
          <span class="muted" id="jCount"></span>
          <span id="jSyncBtn"></span>
        </div>
      </div>
      <div class="panel-body" id="jBody" style="max-height: 72vh; overflow-y: auto;"></div>
    </div>
  `;
  applyI18n(root);
  _render(root);
  _unsub = Journal.onChange(() => _render(root));
  _syncUnmount = mountSyncButton(root.querySelector('#jSyncBtn'));
}

export function unmount(root) {
  if (_unsub)       { _unsub(); _unsub = null; }
  if (_syncUnmount) { _syncUnmount(); _syncUnmount = null; }
  root.innerHTML = '';
}

function _render(root) {
  const entries = Journal.getAll();
  const body  = root.querySelector('#jBody');
  const count = root.querySelector('#jCount');
  count.textContent = `${entries.length} ${entries.length === 1 ? t('entry') : t('entries')}`;

  if (!entries.length) {
    body.innerHTML = `
      <div class="empty">
        <div class="emo">📓</div>
        <div class="ttl">${t('empty_journal_t')}</div>
        <div class="sub">${t('journal_empty_sub')}</div>
      </div>`;
    return;
  }

  body.innerHTML = entries.map((e, i) => {
    const action = String(e.action || 'BUY').toUpperCase();
    const cls = action === 'BUY'  ? 'action-buy'
              : action === 'SELL' ? 'action-sell'
              : action === 'TRIM' ? 'action-trim'
              : 'action-add';
    const dateStr = _fmtDate(e.date);
    return `
      <div class="journal-entry" style="animation: viewIn 280ms var(--ease-out) ${i * 20}ms backwards;">
        <div class="row">
          <span class="date">${escapeHtml(dateStr)}</span>
          <span class="hstack">
            ${e.ticker ? `<span class="ticker">${escapeHtml(e.ticker)}</span>` : ''}
            <span class="${cls}">${escapeHtml(action)}</span>
          </span>
        </div>
        ${e.reason  ? `<div class="field"><b>${t('reason_l')}</b> ${escapeHtml(e.reason)}</div>`  : ''}
        ${e.emotion ? `<div class="field"><b>${t('emotion_l')}</b> ${escapeHtml(e.emotion)}</div>` : ''}
        ${e.lesson  ? `<div class="field"><b>${t('lesson_l')}</b> ${escapeHtml(e.lesson)}</div>`  : ''}
      </div>`;
  }).join('');
}

function _fmtDate(d) {
  if (!d) return '—';
  const s = String(d);
  // If ISO, slice to YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return s;
}
