/* ============================================================
   TradeOS v4.0 — toast
   Tiny notifications stack. type: success | error | info | warn.
   ============================================================ */

const MAX = 5;

function _host() {
  let host = document.getElementById('toasts');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toasts';
    host.className = 'toasts';
    document.body.appendChild(host);
  }
  return host;
}

export function toast(message, type = 'info', ttl = 3200) {
  const host = _host();
  while (host.children.length >= MAX) host.firstElementChild.remove();
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  host.appendChild(el);
  setTimeout(() => {
    el.classList.add('hide');
    setTimeout(() => el.remove(), 320);
  }, ttl);
  return el;
}
