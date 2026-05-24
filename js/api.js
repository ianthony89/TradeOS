/* ============================================================
   TradeOS v4.0 — API client
   Talks to a Google Apps Script Web App.

   IMPORTANT — CORS:
   GAS Web Apps reject browser preflight (OPTIONS) requests. To
   avoid preflight we POST a JSON-encoded body with a "simple"
   Content-Type of text/plain. The script's doPost(e) reads
   e.postData.contents and JSON.parse() it. See server/Code.gs.

   Wire format (request):
     { action: string, payload?: object, key?: string }
   Wire format (response):
     { ok: true,  data: <anything> }
     { ok: false, error: string }
   ============================================================ */

import { KEYS, getRaw, setRaw, remove } from './storage.js';

const DEFAULT_TIMEOUT_MS = 15000;

let _endpoint = getRaw(KEYS.API_ENDPOINT) || '';
let _key      = getRaw(KEYS.API_KEY) || '';

export function getConfig() {
  return { endpoint: _endpoint, key: _key };
}

export function isConfigured() {
  return !!_endpoint;
}

export function configure({ endpoint, key }) {
  _endpoint = (endpoint || '').trim();
  _key      = (key || '').trim();
  if (_endpoint) setRaw(KEYS.API_ENDPOINT, _endpoint); else remove(KEYS.API_ENDPOINT);
  if (_key)      setRaw(KEYS.API_KEY,      _key);      else remove(KEYS.API_KEY);
}

export function clearConfig() {
  _endpoint = '';
  _key = '';
  remove(KEYS.API_ENDPOINT);
  remove(KEYS.API_KEY);
}

/**
 * Low-level call. Throws on network/HTTP/API error.
 * @param {string} action
 * @param {object} [payload]
 * @param {{timeoutMs?: number}} [opts]
 * @returns {Promise<any>}  the `data` field on success
 */
export async function call(action, payload = {}, opts = {}) {
  if (!_endpoint) throw new Error('API endpoint not configured');
  const timeoutMs = opts.timeoutMs || DEFAULT_TIMEOUT_MS;

  const body = JSON.stringify({
    action,
    payload,
    key: _key || undefined,
    ts: Date.now(),
  });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(_endpoint, {
      method: 'POST',
      // text/plain keeps this a "simple" CORS request — no preflight.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
      redirect: 'follow',
      signal: ctrl.signal,
      mode: 'cors',
    });
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') throw new Error(`Timeout after ${timeoutMs}ms`);
    throw new Error(e.message || 'Network error');
  }
  clearTimeout(timer);

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  let json;
  try { json = await res.json(); }
  catch (e) { throw new Error('Invalid JSON response from API'); }

  if (json && json.ok === false) throw new Error(json.error || 'API error');
  if (!json || typeof json !== 'object' || json.ok !== true) {
    throw new Error('Unexpected API response shape');
  }
  return json.data;
}

/** Ping the API. Returns latency in ms. */
export async function ping() {
  const t0 = performance.now();
  await call('ping', {}, { timeoutMs: 8000 });
  return Math.round(performance.now() - t0);
}
