/* ============================================================
   TradeOS v4.0 — alerts module (Phase 5)
   Alert Center: create, manage, and monitor price alerts
   against live quote data. Detection runs in stores/alerts.js
   whenever quotes refresh (every 60s).
   ============================================================ */

import { t, applyI18n } from '../js/i18n.js';
import * as AlertsStore from '../js/stores/alerts.js';
import * as Quotes      from '../js/quotes.js';
import { isConfigured } from '../js/api.js';
import { escapeHtml }   from '../js/domain/format.js';
import { toast }        from '../js/toast.js';
import { Modal }        from '../components/modal.js';

let _unsub = null;
let _triggered = null;

export function mount(root) {
  root.innerHTML = `
    <div class="grid-2" style="gap:18px;align-items:start;">

      <!-- Create alert -->
      <div class="panel">
        <div class="panel-head">
          <h3 data-i18n="alert_create">${t('alert_create')}</h3>
        </div>
        <div class="panel-body">
          <div class="form-row">
            <div class="form-grid-2">
              <div>
                <label data-i18n="alert_symbol">${t('alert_symbol')}</label>
                <input type="text" id="aSymbol" placeholder="NVDA" style="text-transform:uppercase"/>
              </div>
              <div>
                <label data-i18n="alert_condition">${t('alert_condition')}</label>
                <select id="aCondition">
                  <option value="above">${t('alert_condition_above')}</option>
                  <option value="below">${t('alert_condition_below')}</option>
                  <option value="change_pct">${t('alert_condition_change')}</option>
                </select>
              </div>
            </div>
            <div>
              <label data-i18n="alert_target">${t('alert_target')}</label>
              <div style="display:flex;gap:8px;align-items:center;">
                <input type="number" id="aTarget" step="any" placeholder="0.00" style="flex:1"/>
                <span class="muted" id="aLiveHint" style="font-size:11px;white-space:nowrap;"></span>
              </div>
            </div>
            <div>
              <label data-i18n="alert_notes">${t('alert_notes')}</label>
              <input type="text" id="aNotes" placeholder="${escapeHtml(t('alert_notes_ph'))}"/>
            </div>
            <button class="btn primary" id="aAdd" data-i18n="alert_add">${t('alert_add')}</button>
          </div>
          ${!isConfigured() ? `<div class="warn-box" style="margin-top:12px;">${t('alert_no_quotes')}</div>` : ''}
        </div>
      </div>

      <!-- Active alerts -->
      <div class="panel">
        <div class="panel-head">
          <h3 data-i18n="alert_active">${t('alert_active')}</h3>
          <span class="muted" id="alertActiveCount">—</span>
        </div>
        <div class="panel-body" id="alertActiveBody"></div>
      </div>
    </div>

    <!-- Triggered alerts -->
    <div class="panel" id="triggeredPanel">
      <div class="panel-head">
        <h3 data-i18n="alert_triggered">${t('alert_triggered')}</h3>
        <span class="muted" id="alertTriggeredCount">—</span>
      </div>
      <div class="panel-body" id="alertTriggeredBody"></div>
    </div>

    <!-- All alerts history -->
    <div class="panel">
      <div class="panel-head">
        <h3 data-i18n="alert_history">${t('alert_history')}</h3>
        <button class="btn sm ghost danger" id="alertClearAll" data-i18n="alert_clear_all">${t('alert_clear_all')}</button>
      </div>
      <div class="panel-body" id="alertHistoryBody"></div>
    </div>
  `;

  applyI18n(root);
  _bind(root);
  _render(root);

  _unsub = AlertsStore.onChange(() => _render(root));

  // Listen for triggered events to show toasts
  _triggered = (e) => {
    const a = e.detail;
    const condLabel = a.condition === 'above' ? t('alert_condition_above')
                    : a.condition === 'below' ? t('alert_condition_below')
                    : t('alert_condition_change');
    toast(t('alert_triggered_toast', { sym: a.symbol, cond: condLabel, target: a.target }), 'warn', 5000);
  };
  window.addEventListener('tradeos:alert-triggered', _triggered);
}

export function unmount(root) {
  if (_unsub)     { _unsub(); _unsub = null; }
  if (_triggered) { window.removeEventListener('tradeos:alert-triggered', _triggered); _triggered = null; }
  root.innerHTML = '';
}

/* ---- Bind ---- */

function _bind(root) {
  // Live price hint when symbol changes
  root.querySelector('#aSymbol').addEventListener('input', (e) => {
    const sym = e.target.value.toUpperCase().trim();
    const q = Quotes.getQuote(sym);
    const hint = root.querySelector('#aLiveHint');
    hint.textContent = q && q.price ? t('planner_live_price', { price: q.price.toFixed(2) }) : '';
  });

  root.querySelector('#aAdd').addEventListener('click', () => {
    const symbol    = root.querySelector('#aSymbol').value.trim().toUpperCase();
    const condition = root.querySelector('#aCondition').value;
    const target    = parseFloat(root.querySelector('#aTarget').value);
    const notes     = root.querySelector('#aNotes').value.trim();

    if (!symbol)    { toast(t('toast_sym_req'), 'error'); return; }
    if (isNaN(target) || target === 0) { toast(t('alert_invalid_target'), 'error'); return; }

    AlertsStore.createAlert({ symbol, condition, target, notes });
    root.querySelector('#aSymbol').value  = '';
    root.querySelector('#aTarget').value  = '';
    root.querySelector('#aNotes').value   = '';
    root.querySelector('#aLiveHint').textContent = '';
    toast(`${symbol} ${t('alert_created')}`, 'success');
  });

  root.querySelector('#alertClearAll').addEventListener('click', async () => {
    const ok = await Modal.confirm({
      title:        t('modal_alert_clear_title'),
      message:      t('alert_confirm_clear'),
      confirmLabel: t('clear_all'),
      cancelLabel:  t('cancel'),
    });
    if (!ok) return;
    AlertsStore.clearAll();
    toast(t('alert_cleared'), 'info');
  });
}

/* ---- Render ---- */

function _render(root) {
  const all       = AlertsStore.getAll();
  const active    = all.filter(a => a.status === 'active' || a.status === 'snoozed');
  const triggered = all.filter(a => a.status === 'triggered');
  const history   = all.filter(a => a.status === 'dismissed').concat(triggered);

  root.querySelector('#alertActiveCount').textContent   = `${active.length} ${t(active.length === 1 ? 'item' : 'items')}`;
  root.querySelector('#alertTriggeredCount').textContent = `${triggered.length} ${t(triggered.length === 1 ? 'item' : 'items')}`;

  // Show/hide triggered panel
  root.querySelector('#triggeredPanel').style.display = triggered.length ? '' : 'none';

  _renderList(root.querySelector('#alertActiveBody'), active, 'active');
  _renderList(root.querySelector('#alertTriggeredBody'), triggered, 'triggered');
  _renderList(root.querySelector('#alertHistoryBody'), history, 'history');
}

function _renderList(el, list, mode) {
  if (!list.length) {
    el.innerHTML = `<div class="empty" style="padding:20px;"><div class="emo">🔔</div><div class="ttl">${t('alert_empty_t')}</div><div class="sub">${t('alert_empty_s')}</div></div>`;
    return;
  }

  el.innerHTML = list.map((a, i) => {
    const q = Quotes.getQuote(a.symbol);
    const currentPrice = q && q.price ? q.price.toFixed(2) : '—';
    const condLabel = a.condition === 'above' ? '>' : a.condition === 'below' ? '<' : '±%';
    const statusCls = a.status === 'triggered' ? 'alert-triggered' : a.status === 'snoozed' ? 'alert-snoozed' : 'alert-active';

    const trigDate = a.triggered_at ? ` · ${t('alert_triggered_at')}: ${a.triggered_at.slice(0, 10)}` : '';
    const snoozeInfo = a.snoozed_until ? ` · ${t('alert_snoozed_until')}: ${a.snoozed_until.slice(0, 10)}` : '';

    return `
      <div class="alert-item ${statusCls}" data-id="${escapeHtml(a.id)}" style="animation: viewIn 280ms var(--ease-out) ${i * 25}ms backwards;">
        <div class="alert-head">
          <div>
            <span class="sym"><span class="sym-ico">${escapeHtml(a.symbol.slice(0,4))}</span>${escapeHtml(a.symbol)}</span>
            <span class="alert-cond">${condLabel} <strong>${a.target}</strong></span>
          </div>
          <div class="alert-price muted">
            ${t('col_last')}: <span style="${q && q.price ? (q.price >= a.target && a.condition === 'above' ? 'color:var(--green)' : q.price <= a.target && a.condition === 'below' ? 'color:var(--red)' : '') : ''}">${currentPrice}</span>
          </div>
        </div>
        ${a.notes ? `<div class="alert-notes muted">${escapeHtml(a.notes)}</div>` : ''}
        <div class="alert-meta muted">${t('added')}: ${a.created_at.slice(0,10)}${trigDate}${snoozeInfo}</div>
        <div class="alert-actions">
          ${a.status === 'triggered' ? `<button class="btn sm" data-action="reactivate" data-id="${escapeHtml(a.id)}">${t('alert_reactivate')}</button>` : ''}
          ${a.status === 'active'    ? `<button class="btn sm ghost" data-action="snooze" data-id="${escapeHtml(a.id)}">${t('alert_snooze')}</button>` : ''}
          ${a.status !== 'dismissed' ? `<button class="btn sm ghost" data-action="dismiss" data-id="${escapeHtml(a.id)}">${t('alert_dismiss')}</button>` : ''}
          <button class="btn sm ghost danger" data-action="delete" data-id="${escapeHtml(a.id)}">${t('alert_delete')}</button>
        </div>
      </div>
    `;
  }).join('');

  // Bind action buttons
  el.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id     = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === 'delete')     { AlertsStore.deleteAlert(id); }
      if (action === 'dismiss')    { AlertsStore.dismissAlert(id); }
      if (action === 'snooze')     { AlertsStore.snoozeAlert(id, 24); toast(t('alert_snoozed_toast'), 'info'); }
      if (action === 'reactivate') { AlertsStore.reactivateAlert(id); }
    });
  });
}
