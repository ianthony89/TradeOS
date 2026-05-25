/* ============================================================
   TradeOS v4.0 — topbar component
   Greeting + market clocks (US/MY) + sync pill + lang/theme/lock buttons.
   ============================================================ */

import { t, applyI18n, setLang, getLang,
         fmtClock, usSessionState, mySessionState, greetingKey } from '../js/i18n.js';
import { getSettings, saveSettings } from '../js/storage.js';
import * as Sync from '../js/sync.js';
import * as Auth from '../js/auth.js';

let _clockTimer = null;
let _syncSub = null;

function _greeting() {
  const s = getSettings();
  const greet = t(greetingKey());
  return s.lang === 'zh' ? `${greet},${s.name}` : `${greet}, ${s.name}`;
}

function _formatLastAt(ms) {
  if (!ms) return '';
  const diffS = Math.round((Date.now() - ms) / 1000);
  if (diffS < 5)  return t('sync_just_now');
  if (diffS < 60) return t('sync_seconds_ago', { n: diffS });
  return t('sync_minutes_ago', { n: Math.round(diffS / 60) });
}

function _syncLabel(snap) {
  switch (snap.state) {
    case Sync.STATES.SYNCING:      return t('sync_syncing');
    case Sync.STATES.OK:           return `${t('sync_ok')} · ${_formatLastAt(snap.lastOk)}`;
    case Sync.STATES.ERROR:        return t('sync_error');
    case Sync.STATES.OFFLINE:      return t('sync_offline');
    case Sync.STATES.UNCONFIGURED: return t('sync_unconfigured');
    default:                       return t('sync_idle');
  }
}

function _renderClocks() {
  const elMY  = document.getElementById('clockMY');
  const elUS  = document.getElementById('clockUS');
  const elMYS = document.getElementById('sessMY');
  const elUSS = document.getElementById('sessUS');
  if (!elMY) return;
  const locale = getLang() === 'zh' ? 'zh-CN' : 'en-US';
  elMY.textContent = fmtClock('Asia/Kuala_Lumpur', { hour12: false, locale });
  elUS.textContent = fmtClock('America/New_York',  { hour12: true,  locale });
  const us = usSessionState();
  const my = mySessionState();
  elUSS.textContent = t(us.key);
  elUSS.dataset.code = us.code;
  elMYS.textContent = t(my.key);
  elMYS.dataset.code = my.code;
}

function _renderGreeting() {
  const g = document.getElementById('greeting');
  if (g) g.textContent = _greeting();
}

function _renderSyncPill(snap) {
  const pill = document.getElementById('syncPill');
  if (!pill) return;
  pill.dataset.state = snap.state;
  pill.querySelector('.lbl').textContent = _syncLabel(snap);
  pill.title = snap.lastError ? snap.lastError : t('sync_now_btn');
}

export function mountTopbar() {
  const root = document.getElementById('topbar');
  if (!root) return;

  root.innerHTML = `
    <div class="topbar-left">
      <h1 id="greeting">…</h1>
      <div class="subtitle hstack">
        <span class="pill"><span class="dot"></span><span class="lbl">MY</span> <span id="clockMY">--:--</span> · <span id="sessMY" class="muted">…</span></span>
        <span class="pill info"><span class="dot"></span><span class="lbl">US</span> <span id="clockUS">--:--</span> · <span id="sessUS" class="muted">…</span></span>
      </div>
    </div>
    <div class="topbar-right">
      <button id="syncPill" class="sync-pill" data-state="idle" title="">
        <span class="ind"></span>
        <span class="lbl">${t('sync_idle')}</span>
      </button>
      <button class="btn ghost sm" id="btnLang" title="Language">${getLang() === 'zh' ? 'EN' : '中文'}</button>
      <button class="btn ghost sm" id="btnTheme" title="Theme">${getSettings().theme === 'light' ? '🌙' : '☀'}</button>
      <button class="btn ghost sm" id="btnLock" title="${t('pin_lock_now_btn')}">🔒</button>
    </div>
  `;

  // Sync pill — click to trigger immediate sync
  document.getElementById('syncPill').addEventListener('click', () => Sync.runOnce());

  // Lang toggle
  document.getElementById('btnLang').addEventListener('click', () => {
    const cur = getLang();
    const next = cur === 'zh' ? 'en' : 'zh';
    setLang(next);
    saveSettings({ lang: next });
    applyI18n();
    _renderGreeting();
    _renderClocks();
    _renderSyncPill(Sync.getState());
    document.getElementById('btnLang').textContent = next === 'zh' ? 'EN' : '中文';
  });

  // Theme toggle
  document.getElementById('btnTheme').addEventListener('click', () => {
    const cur = getSettings().theme;
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    saveSettings({ theme: next });
    document.getElementById('btnTheme').textContent = next === 'light' ? '🌙' : '☀';
  });

  // Lock-now
  document.getElementById('btnLock').addEventListener('click', () => {
    if (Auth.hasPin()) Auth.lock();
  });

  // Mount visual state
  _renderGreeting();
  _renderClocks();

  // Re-render greeting whenever name or lang changes from Settings.
  window.addEventListener('tradeos:name-changed', _renderGreeting);

  // Clock ticker — re-render once a second.
  if (_clockTimer) clearInterval(_clockTimer);
  _clockTimer = setInterval(() => {
    _renderClocks();
    // Refresh "Xs ago" label live without thrashing other state.
    const snap = Sync.getState();
    if (snap.state === Sync.STATES.OK) _renderSyncPill(snap);
  }, 1000);

  // Subscribe to sync state.
  if (_syncSub) _syncSub();
  _syncSub = Sync.subscribe(_renderSyncPill);

  applyI18n(root);
}
