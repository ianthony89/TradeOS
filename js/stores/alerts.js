/* ============================================================
   TradeOS v4.0 — stores/alerts
   Alert definitions + detection engine.
   Alerts are stored locally (localStorage). Optionally synced
   to a GAS Alerts sheet via the registered sync handler.

   Alert schema:
     id         — stable random id
     symbol     — uppercase ticker
     condition  — 'above' | 'below' | 'change_pct'
     target     — numeric threshold
     status     — 'active' | 'triggered' | 'snoozed' | 'dismissed'
     created_at — ISO timestamp
     triggered_at — ISO | null
     snoozed_until — ISO | null
     notes      — free text

   Detection runs whenever quotes update (subscribed to Quotes).
   ============================================================ */

import { KEYS, get, set } from '../storage.js';
import * as Quotes from '../quotes.js';

// Extend KEYS namespace (non-persisted constant — no storage conflict)
const ALERTS_KEY = 'tradeos.v4.alerts';

let _alerts = [];
const _listeners = new Set();

/* ---- Internal ---- */

function _load() {
  const stored = get(ALERTS_KEY, []);
  _alerts = Array.isArray(stored) ? stored.map(_sanitize) : [];
}

function _save() {
  try { localStorage.setItem(ALERTS_KEY, JSON.stringify(_alerts)); } catch (e) { /* noop */ }
}

function _emit() {
  _listeners.forEach(fn => { try { fn([..._alerts]); } catch (e) { console.error(e); } });
}

function _sanitize(r) {
  r = r || {};
  return {
    id:           r.id           || _uid(),
    symbol:       String(r.symbol || '').toUpperCase().trim(),
    condition:    r.condition    || 'above',   // 'above' | 'below' | 'change_pct'
    target:       Number(r.target) || 0,
    status:       r.status       || 'active',  // 'active'|'triggered'|'snoozed'|'dismissed'
    created_at:   r.created_at   || new Date().toISOString(),
    triggered_at: r.triggered_at || null,
    snoozed_until:r.snoozed_until || null,
    notes:        r.notes        || '',
  };
}

function _uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ---- Detection ---- */

function _detect() {
  const quotes = Quotes.getAll();
  if (!Object.keys(quotes).length) return;

  let fired = false;
  const now = Date.now();

  _alerts.forEach(alert => {
    if (alert.status !== 'active') {
      // Unsnoze if time has elapsed
      if (alert.status === 'snoozed' && alert.snoozed_until && now > new Date(alert.snoozed_until).getTime()) {
        alert.status = 'active';
        alert.snoozed_until = null;
        fired = true;
      }
      return;
    }

    const q = quotes[alert.symbol];
    if (!q || !q.price) return;

    const price    = Number(q.price);
    const prevClose = Number(q.prevClose) || 0;
    let triggered  = false;

    if (alert.condition === 'above') {
      triggered = price >= alert.target;
    } else if (alert.condition === 'below') {
      triggered = price <= alert.target;
    } else if (alert.condition === 'change_pct') {
      // Day change % — positive target = up, negative = down
      if (prevClose > 0) {
        const changePct = ((price - prevClose) / prevClose) * 100;
        triggered = alert.target >= 0
          ? changePct >= alert.target
          : changePct <= alert.target;
      }
    }

    if (triggered) {
      alert.status       = 'triggered';
      alert.triggered_at = new Date().toISOString();
      fired = true;
      // Notify via custom event (modules listen to this)
      try {
        window.dispatchEvent(new CustomEvent('tradeos:alert-triggered', { detail: { ...alert } }));
      } catch (e) { /* noop */ }
    }
  });

  if (fired) { _save(); _emit(); }
}

/* ---- Public API ---- */

export function init() {
  _load();
  // Run detection whenever quotes update
  Quotes.subscribe(() => _detect());
}

export function getAll() { return [..._alerts]; }
export function getActive() { return _alerts.filter(a => a.status === 'active'); }
export function getTriggered() { return _alerts.filter(a => a.status === 'triggered'); }

export function onChange(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

export function createAlert(input) {
  const alert = _sanitize({ ...input, id: _uid(), created_at: new Date().toISOString() });
  if (!alert.symbol) return null;
  _alerts.push(alert);
  _save();
  _emit();
  return alert;
}

export function updateAlert(id, patch) {
  const idx = _alerts.findIndex(a => a.id === id);
  if (idx < 0) return;
  _alerts[idx] = _sanitize({ ..._alerts[idx], ...patch });
  _save();
  _emit();
}

export function deleteAlert(id) {
  _alerts = _alerts.filter(a => a.id !== id);
  _save();
  _emit();
}

export function dismissAlert(id) {
  updateAlert(id, { status: 'dismissed' });
}

export function snoozeAlert(id, hours = 24) {
  const until = new Date(Date.now() + hours * 3600000).toISOString();
  updateAlert(id, { status: 'snoozed', snoozed_until: until });
}

export function reactivateAlert(id) {
  updateAlert(id, { status: 'active', triggered_at: null, snoozed_until: null });
}

export function clearAll() {
  _alerts = [];
  _save();
  _emit();
}
