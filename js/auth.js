/* ============================================================
   TradeOS v4.0 — auth
   PIN lock screen. PIN is stored as a salted SHA-256 hash in
   localStorage (never the raw PIN). This protects against casual
   inspection of devtools, not against a determined attacker who
   already controls the device.
   ============================================================ */

import { KEYS, get, set, remove, getRaw, setRaw, wipeAll, getSettings } from './storage.js';
import { t } from './i18n.js';

const MIN_LEN = 4;
const MAX_LEN = 8;

let _locked = true;
let _onUnlock = null;
const _listeners = new Set();

export function isLocked() { return _locked; }
export function onChange(fn) { _listeners.add(fn); return () => _listeners.delete(fn); }
function _emit() { _listeners.forEach(fn => { try { fn(_locked); } catch (e) {} }); }

export function hasPin() {
  return !!getRaw(KEYS.PIN);
}

/* ---------- Hashing ---------- */

async function _hash(pin, salt) {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}::${pin}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function _newSalt() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Persist a new PIN. Returns true if accepted. */
export async function setPin(pin) {
  if (!pin || pin.length < MIN_LEN || pin.length > MAX_LEN) return false;
  const salt = _newSalt();
  const hash = await _hash(pin, salt);
  setRaw(KEYS.PIN_SALT, salt);
  setRaw(KEYS.PIN, hash);
  return true;
}

/** Verify entered PIN against stored hash. */
export async function verify(pin) {
  const salt = getRaw(KEYS.PIN_SALT);
  const stored = getRaw(KEYS.PIN);
  if (!salt || !stored) return false;
  const hash = await _hash(pin, salt);
  return hash === stored;
}

/* ---------- Lock screen UI ---------- */

let _buffer = '';
let _mode = 'enter';        // 'enter' | 'create' | 'confirm'
let _firstPin = null;       // captured during 'create' before 'confirm'

const els = {
  wrap: null, title: null, sub: null, dots: null, pad: null, msg: null, brand: null,
};

function _grab() {
  if (els.wrap) return;
  els.wrap  = document.getElementById('lock');
  els.title = document.getElementById('lockTitle');
  els.sub   = document.getElementById('lockSub');
  els.dots  = document.getElementById('lockDots');
  els.pad   = document.getElementById('lockPad');
  els.msg   = document.getElementById('lockMsg');
  els.brand = document.getElementById('lockBrand');
}

function _renderPad() {
  const keys = ['1','2','3','4','5','6','7','8','9','clear','0','back'];
  els.pad.innerHTML = keys.map(k => {
    if (k === 'clear') return `<button type="button" class="lock-key ghost" data-key="clear">${t('lock_key_clear')}</button>`;
    if (k === 'back')  return `<button type="button" class="lock-key ghost" data-key="back">${t('lock_key_back')}</button>`;
    return `<button type="button" class="lock-key" data-key="${k}">${k}</button>`;
  }).join('');
  els.pad.querySelectorAll('.lock-key').forEach(btn => {
    btn.addEventListener('click', () => _press(btn.dataset.key));
  });
}

function _renderDots() {
  const want = Math.max(MIN_LEN, Math.min(MAX_LEN, _buffer.length || MIN_LEN));
  const total = Math.max(want, _buffer.length);
  let html = '';
  for (let i = 0; i < total; i++) {
    html += `<span class="d ${i < _buffer.length ? 'filled' : ''}"></span>`;
  }
  els.dots.innerHTML = html;
}

function _setTitle() {
  const titles = { enter: 'lock_title_enter', create: 'lock_title_create', confirm: 'lock_title_confirm' };
  const subs   = { enter: 'lock_sub_enter',   create: 'lock_sub_create',   confirm: 'lock_sub_confirm' };
  els.title.textContent = t(titles[_mode]);
  els.sub.textContent = t(subs[_mode]);
  els.brand.textContent = t('lock_brand');
}

function _setMsg(text, isError) {
  els.msg.textContent = text || '';
  els.msg.classList.toggle('error', !!isError);
  els.wrap.classList.toggle('error', !!isError);
  if (isError) setTimeout(() => els.wrap.classList.remove('error'), 480);
}

function _press(key) {
  if (key === 'clear') { _buffer = ''; _setMsg(''); _renderDots(); return; }
  if (key === 'back')  { _buffer = _buffer.slice(0, -1); _setMsg(''); _renderDots(); return; }
  if (!/^\d$/.test(key)) return;
  if (_buffer.length >= MAX_LEN) { _setMsg(t('lock_msg_max'), true); return; }
  _buffer += key;
  _setMsg('');
  _renderDots();
  if (_buffer.length >= MIN_LEN) {
    // Auto-submit only when the user has paused (Enter key); to keep flow simple, submit on length === MAX or via Enter.
  }
}

async function _submit() {
  if (_buffer.length < MIN_LEN) { _setMsg(t('lock_msg_min'), true); return; }
  if (_mode === 'enter') {
    const ok = await verify(_buffer);
    if (!ok) { _setMsg(t('lock_msg_wrong'), true); _buffer = ''; _renderDots(); return; }
    _finishUnlock();
    return;
  }
  if (_mode === 'create') {
    _firstPin = _buffer;
    _buffer = '';
    _mode = 'confirm';
    _setTitle();
    _renderDots();
    _setMsg('');
    return;
  }
  if (_mode === 'confirm') {
    if (_buffer !== _firstPin) {
      _firstPin = null;
      _buffer = '';
      _mode = 'create';
      _setTitle();
      _renderDots();
      _setMsg(t('lock_msg_mismatch'), true);
      return;
    }
    const ok = await setPin(_buffer);
    if (!ok) { _setMsg(t('lock_msg_min'), true); return; }
    _firstPin = null;
    _finishUnlock();
  }
}

function _finishUnlock() {
  _buffer = '';
  _locked = false;
  els.wrap.classList.remove('show');
  _emit();
  if (typeof _onUnlock === 'function') {
    const cb = _onUnlock;
    _onUnlock = null;
    try { cb(); } catch (e) {}
  }
}

function _forget() {
  if (!confirm(t('lock_forget_confirm'))) return;
  wipeAll();
  _firstPin = null;
  _buffer = '';
  _mode = 'create';
  _setTitle();
  _renderDots();
  _setMsg('');
}

function _bindKeyboard() {
  window.addEventListener('keydown', (e) => {
    if (!_locked) return;
    if (e.key >= '0' && e.key <= '9') { _press(e.key); e.preventDefault(); return; }
    if (e.key === 'Backspace')         { _press('back'); e.preventDefault(); return; }
    if (e.key === 'Enter')             { _submit();      e.preventDefault(); return; }
    if (e.key === 'Escape')            { _press('clear');e.preventDefault(); return; }
  });
}

/** Show the lock UI. Returns a promise that resolves when unlocked. */
export function showLock(opts = {}) {
  _grab();
  _locked = true;
  _buffer = '';
  _firstPin = null;
  _mode = opts.forceCreate || !hasPin() ? 'create' : 'enter';
  _setTitle();
  _renderPad();
  _renderDots();
  _setMsg('');
  els.wrap.classList.add('show');
  _emit();

  // Footer "Forget PIN" button only available in enter mode and when a PIN exists.
  const foot = document.getElementById('lockForget');
  if (foot) {
    foot.style.display = (_mode === 'enter' && hasPin()) ? 'inline-block' : 'none';
    foot.onclick = _forget;
  }
  const submitBtn = document.getElementById('lockSubmit');
  if (submitBtn) {
    submitBtn.textContent = _mode === 'enter' ? '→' : '✓';
    submitBtn.onclick = _submit;
  }

  return new Promise(resolve => { _onUnlock = resolve; });
}

export function lock() {
  if (!hasPin()) return; // nothing to lock against
  _grab();
  showLock();
}

/** Initialize keyboard bindings once. */
export function initAuth() {
  _bindKeyboard();

  // Auto-lock when tab becomes hidden, if user opted in.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && getSettings().lockOnHide && hasPin() && !_locked) {
      lock();
    }
  });
}
