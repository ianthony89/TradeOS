/* ============================================================
   TradeOS v4.0 — storage
   Namespaced, JSON-safe localStorage wrapper.
   All keys are prefixed `tradeos.v4.` so future versions can
   migrate without colliding with v3.7 (`atcc.v3.*`).
   ============================================================ */

const NS = 'tradeos.v4';

export const KEYS = {
  PIN:           `${NS}.auth.pin`,
  PIN_SALT:      `${NS}.auth.salt`,
  LOCK_ON_HIDE:  `${NS}.auth.lockOnHide`,
  SETTINGS:      `${NS}.settings`,
  API_ENDPOINT:  `${NS}.api.endpoint`,
  API_KEY:       `${NS}.api.key`,
  SYNC_INTERVAL: `${NS}.sync.interval`,
  SYNC_LAST_AT:  `${NS}.sync.lastAt`,
  SYNC_LAST_OK:  `${NS}.sync.lastOk`,
  // Reserved for Phase 2+
  HOLDINGS:      `${NS}.holdings`,
  WATCHLIST:     `${NS}.watchlist`,
  JOURNAL:       `${NS}.journal`,
};

export function getRaw(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}

export function get(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

export function set(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

export function setRaw(key, value) {
  try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
}

export function remove(key) {
  try { localStorage.removeItem(key); } catch (e) { /* noop */ }
}

/** Wipe every key in the tradeos.v4.* namespace. Used by "Forget PIN". */
export function wipeAll() {
  try {
    const toDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(NS + '.')) toDelete.push(k);
    }
    toDelete.forEach(k => localStorage.removeItem(k));
  } catch (e) { /* noop */ }
}

/** Default settings shape. Modules read/write through getSettings/saveSettings. */
export const DEFAULT_SETTINGS = {
  name: 'Trader',
  lang: 'en',
  theme: 'dark',
  syncIntervalSec: 30,
  lockOnHide: false,
};

export function getSettings() {
  const stored = get(KEYS.SETTINGS, {});
  return { ...DEFAULT_SETTINGS, ...(stored || {}) };
}

export function saveSettings(patch) {
  const next = { ...getSettings(), ...(patch || {}) };
  set(KEYS.SETTINGS, next);
  return next;
}
