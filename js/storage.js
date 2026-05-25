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
  // Phase 4 — live quotes
  QUOTES:         `${NS}.quotes`,
  QUOTES_LAST_AT: `${NS}.quotes.lastAt`,
  QUOTES_LAST_OK: `${NS}.quotes.lastOk`,
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
  syncIntervalSec: 0,       // 0 = manual only (no auto-poll)
  quotesIntervalSec: 300,   // 5 min default
  lockOnHide: false,
  // Phase 2 — portfolio / risk
  cash: 0,
  marketFilter: 'ALL',                                  // 'ALL' | 'MY' | 'US' | 'HK'
  fxRates: { USD_MYR: 4.00, HKD_USD: 0.128, SGD_USD: 0.74, CNY_USD: 0.138 },
  risk:    { levWarn: 30, levCrit: 50, conc: 40, spec: 35 },
};

export function getSettings() {
  const stored = get(KEYS.SETTINGS, {}) || {};
  // Merge with nested-object awareness so a partial save never drops keys.
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    fxRates: { ...DEFAULT_SETTINGS.fxRates, ...(stored.fxRates || {}) },
    risk:    { ...DEFAULT_SETTINGS.risk,    ...(stored.risk    || {}) },
  };
}

export function saveSettings(patch) {
  const current = getSettings();
  const next = {
    ...current,
    ...(patch || {}),
    fxRates: { ...current.fxRates, ...((patch && patch.fxRates) || {}) },
    risk:    { ...current.risk,    ...((patch && patch.risk)    || {}) },
  };
  set(KEYS.SETTINGS, next);
  return next;
}
