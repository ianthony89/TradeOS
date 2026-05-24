/* ============================================================
   TradeOS v4.0 — hash router
   Routes are simple strings like 'dashboard', 'holdings'.
   URL form: index.html#/dashboard
   ============================================================ */

const _routes = new Map();      // name -> { mount, unmount, label }
const _listeners = new Set();
let _current = null;
let _defaultRoute = 'dashboard';
let _started = false;

export function register(name, opts) {
  _routes.set(name, {
    mount:   opts.mount   || (() => {}),
    unmount: opts.unmount || (() => {}),
    label:   opts.label   || name,
  });
}

export function list() {
  return Array.from(_routes.keys());
}

export function current() { return _current; }

export function setDefault(name) { _defaultRoute = name; }

function _parse() {
  const h = window.location.hash || '';
  const m = h.match(/^#\/?([\w-]+)/);
  return m ? m[1] : null;
}

export function go(name) {
  if (!_routes.has(name)) name = _defaultRoute;
  if (window.location.hash !== `#/${name}`) {
    window.location.hash = `#/${name}`;
    return; // hashchange handler will run _activate
  }
  _activate(name);
}

function _activate(name) {
  if (!_routes.has(name)) name = _defaultRoute;
  if (_current === name) return;

  if (_current && _routes.has(_current)) {
    try { _routes.get(_current).unmount(); } catch (e) { console.error(e); }
  }
  _current = name;
  try { _routes.get(name).mount(); } catch (e) { console.error(e); }
  _listeners.forEach(fn => { try { fn(name); } catch (e) {} });
}

export function onChange(fn) { _listeners.add(fn); return () => _listeners.delete(fn); }

export function start() {
  if (_started) return;
  _started = true;
  window.addEventListener('hashchange', () => {
    const r = _parse() || _defaultRoute;
    _activate(r);
  });
  const initial = _parse() || _defaultRoute;
  // Force the URL to canonical form if missing.
  if (!_parse()) {
    window.location.hash = `#/${initial}`;
  } else {
    _activate(initial);
  }
}
