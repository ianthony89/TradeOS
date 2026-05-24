/* ============================================================
   TradeOS v4.0 — modal helper
   Single shared overlay; open({ title, body, actions }) returns a
   handle with .close(). Body can be a string of HTML or a DOM node.
   ============================================================ */

let _wrap = null;

function _ensure() {
  if (_wrap) return _wrap;
  _wrap = document.createElement('div');
  _wrap.className = 'modal-wrap';
  _wrap.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h2 id="modalTitle"></h2>
        <button class="modal-close" id="modalCloseX" aria-label="Close">✕</button>
      </div>
      <div class="modal-body" id="modalBody"></div>
    </div>
  `;
  document.body.appendChild(_wrap);
  _wrap.addEventListener('click', (e) => {
    if (e.target === _wrap) close();
  });
  document.getElementById('modalCloseX').addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && _wrap.classList.contains('show')) close();
  });
  return _wrap;
}

export function open({ title = '', body = '' } = {}) {
  _ensure();
  document.getElementById('modalTitle').textContent = title;
  const bodyEl = document.getElementById('modalBody');
  if (typeof body === 'string') bodyEl.innerHTML = body;
  else { bodyEl.innerHTML = ''; bodyEl.appendChild(body); }
  _wrap.classList.add('show');
  return { close, bodyEl };
}

export function close() {
  if (!_wrap) return;
  _wrap.classList.remove('show');
}
