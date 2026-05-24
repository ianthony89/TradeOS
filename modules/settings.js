/* ============================================================
   TradeOS v4.0 — settings module (Phase 1 — REAL)
   Surfaces: Security (PIN change, lock-on-hide, lock now),
             API & Sync (endpoint, key, test, interval),
             Account & Display (name, theme, language).
   ============================================================ */

import { t, applyI18n, setLang, getLang } from '../js/i18n.js';
import { getSettings, saveSettings } from '../js/storage.js';
import * as Auth from '../js/auth.js';
import * as Api  from '../js/api.js';
import * as Sync from '../js/sync.js';
import { toast } from '../js/toast.js';

const APP_VERSION = 'v4.0.0';

export function mount(root) {
  const s = getSettings();
  const cfg = Api.getConfig();

  root.innerHTML = `
    <!-- Account & display -->
    <div class="panel">
      <div class="panel-head">
        <h3 data-i18n="settings_account">${t('settings_account')}</h3>
      </div>
      <div class="panel-body">
        <div class="form-row">
          <div>
            <label data-i18n="label_name">${t('label_name')}</label>
            <input type="text" id="setName" value="${escapeAttr(s.name)}"/>
          </div>
          <div class="form-grid-2">
            <div>
              <label data-i18n="label_theme">${t('label_theme')}</label>
              <select id="setTheme">
                <option value="dark"  ${s.theme === 'dark'  ? 'selected' : ''} data-i18n="theme_dark">${t('theme_dark')}</option>
                <option value="light" ${s.theme === 'light' ? 'selected' : ''} data-i18n="theme_light">${t('theme_light')}</option>
              </select>
            </div>
            <div>
              <label data-i18n="label_lang">${t('label_lang')}</label>
              <select id="setLang">
                <option value="en" ${s.lang === 'en' ? 'selected' : ''}>English</option>
                <option value="zh" ${s.lang === 'zh' ? 'selected' : ''}>中文</option>
              </select>
            </div>
          </div>
          <div>
            <button class="btn primary" id="btnSaveAccount" data-i18n="btn_save_settings">${t('btn_save_settings')}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Security -->
    <div class="panel">
      <div class="panel-head">
        <h3 data-i18n="settings_security">${t('settings_security')}</h3>
      </div>
      <div class="panel-body">
        <div class="form-row">
          <div class="row-between">
            <label style="margin:0" data-i18n="pin_lock_idle_label">${t('pin_lock_idle_label')}</label>
            <input type="checkbox" id="setLockOnHide" ${s.lockOnHide ? 'checked' : ''} style="width:auto"/>
          </div>
          <div class="hstack">
            <button class="btn" id="btnChangePin" data-i18n="pin_change_btn">${t('pin_change_btn')}</button>
            <button class="btn ghost" id="btnLockNow" data-i18n="pin_lock_now_btn">${t('pin_lock_now_btn')}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- API & Sync -->
    <div class="panel">
      <div class="panel-head">
        <h3 data-i18n="settings_api">${t('settings_api')}</h3>
        <span class="muted" id="syncStatusInline"></span>
      </div>
      <div class="panel-body">
        <div class="form-row">
          <div>
            <label data-i18n="api_endpoint_label">${t('api_endpoint_label')}</label>
            <input type="url" id="setApiEndpoint" value="${escapeAttr(cfg.endpoint)}" placeholder="${escapeAttr(t('api_endpoint_ph'))}"/>
          </div>
          <div>
            <label data-i18n="api_key_label">${t('api_key_label')}</label>
            <input type="password" id="setApiKey" value="${escapeAttr(cfg.key)}" placeholder="${escapeAttr(t('api_key_ph'))}"/>
          </div>
          <div>
            <label data-i18n="sync_interval_label">${t('sync_interval_label')}</label>
            <input type="number" id="setSyncInterval" min="5" max="3600" step="5" value="${s.syncIntervalSec}"/>
          </div>
          <div class="hstack">
            <button class="btn primary" id="btnSaveApi" data-i18n="api_save_btn">${t('api_save_btn')}</button>
            <button class="btn" id="btnTestApi" data-i18n="api_test_btn">${t('api_test_btn')}</button>
            <button class="btn danger ghost" id="btnClearApi" data-i18n="api_clear_btn">${t('api_clear_btn')}</button>
            <span id="apiTestMsg" class="muted"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- About -->
    <div class="panel">
      <div class="panel-head">
        <h3 data-i18n="settings_about">${t('settings_about')}</h3>
      </div>
      <div class="panel-body">
        <div class="muted">TradeOS ${APP_VERSION} · Pure HTML/CSS/Vanilla JS · GitHub Pages + Google Apps Script</div>
      </div>
    </div>
  `;

  applyI18n(root);
  _bind(root);
}

function _bind(root) {
  // Account
  root.querySelector('#btnSaveAccount').addEventListener('click', () => {
    const name  = root.querySelector('#setName').value.trim() || 'Trader';
    const theme = root.querySelector('#setTheme').value;
    const lang  = root.querySelector('#setLang').value;
    saveSettings({ name, theme, lang });
    document.documentElement.setAttribute('data-theme', theme);
    if (lang !== getLang()) {
      setLang(lang);
      applyI18n();
    }
    toast(t('toast_settings_saved'), 'success');
  });

  // Security
  root.querySelector('#setLockOnHide').addEventListener('change', (e) => {
    saveSettings({ lockOnHide: !!e.target.checked });
  });
  root.querySelector('#btnChangePin').addEventListener('click', () => {
    Auth.showLock({ forceCreate: true });
  });
  root.querySelector('#btnLockNow').addEventListener('click', () => {
    if (Auth.hasPin()) Auth.lock();
    else toast(t('pin_change_btn'), 'info');
  });

  // API & sync
  root.querySelector('#btnSaveApi').addEventListener('click', () => {
    const endpoint = root.querySelector('#setApiEndpoint').value.trim();
    const key      = root.querySelector('#setApiKey').value.trim();
    const interval = Number(root.querySelector('#setSyncInterval').value) || 30;
    Api.configure({ endpoint, key });
    saveSettings({ syncIntervalSec: interval });
    Sync.setIntervalSec(interval);
    toast(t('api_saved'), 'success');
    Sync.runOnce();
  });
  root.querySelector('#btnTestApi').addEventListener('click', async () => {
    const endpoint = root.querySelector('#setApiEndpoint').value.trim();
    const key      = root.querySelector('#setApiKey').value.trim();
    const msg = root.querySelector('#apiTestMsg');
    if (!endpoint) { msg.textContent = t('api_test_fail', { msg: 'no endpoint' }); msg.classList.add('muted'); return; }
    // Apply temporarily for the test, then leave it in place — user will Save explicitly.
    Api.configure({ endpoint, key });
    msg.textContent = '…';
    try {
      const ms = await Api.ping();
      msg.textContent = t('api_test_ok', { ms });
      toast(t('api_test_ok', { ms }), 'success');
    } catch (e) {
      msg.textContent = t('api_test_fail', { msg: e.message || e });
      toast(t('api_test_fail', { msg: e.message || e }), 'error');
    }
  });
  root.querySelector('#btnClearApi').addEventListener('click', () => {
    Api.clearConfig();
    root.querySelector('#setApiEndpoint').value = '';
    root.querySelector('#setApiKey').value = '';
    toast(t('api_cleared'), 'info');
    Sync.runOnce();
  });

  // Live sync status under API panel head
  const inlineEl = root.querySelector('#syncStatusInline');
  Sync.subscribe((snap) => {
    if (!inlineEl.isConnected) return;
    inlineEl.textContent = snap.state;
    inlineEl.dataset.state = snap.state;
  });
}

function escapeAttr(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function unmount(root) { root.innerHTML = ''; }
