/* ============================================================
   TradeOS v4.0 — modal (Phase 5.1 — promise-based rewrite)
   Dark glass TradeOS-themed confirm / alert dialogs.
   No native browser confirm() / alert() — ever.

   Modal.confirm({ title, message, warning?, confirmLabel, cancelLabel })
     → Promise<boolean>   (true = confirmed, false = cancelled/dismissed)

   Modal.alert({ title, message })
     → Promise<void>

   Modal.setLoading(bool) — toggle loading spinner on the active OK button
   ============================================================ */

let _wrap = null;
let _activeResolve = null;

function _ensure() {
  if (_wrap) return;
  _wrap = document.createElement('div');
  _wrap.className = 'modal-wrap';
  _wrap.setAttribute('aria-modal', 'true');
  _wrap.setAttribute('role', 'dialog');
  _wrap.innerHTML = `
    <div class="modal">
      <div class="modal-head">
        <h2 class="modal-title" id="mTitle"></h2>
      </div>
      <div class="modal-body">
        <p class="modal-msg" id="mMsg"></p>
        <div class="modal-warn" id="mWarn" style="display:none"></div>
      </div>
      <div class="modal-foot" id="mFoot"></div>
    </div>
  `;
  document.body.appendChild(_wrap);

  // Backdrop click — cancel / dismiss
  _wrap.addEventListener('click', (e) => {
    if (e.target === _wrap) _dismiss();
  });
  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && _wrap.classList.contains('show')) {
      e.preventDefault();
      _dismiss();
    }
  });
}

function _dismiss() {
  _hide();
  if (_activeResolve) { _activeResolve(false); _activeResolve = null; }
}

function _hide() {
  if (_wrap) _wrap.classList.remove('show');
}

function _show({ title, message, warning, foot }) {
  _ensure();
  document.getElementById('mTitle').textContent  = title;
  document.getElementById('mMsg').innerHTML      = message;
  const wEl = document.getElementById('mWarn');
  if (warning) { wEl.innerHTML = warning; wEl.style.display = ''; }
  else           wEl.style.display = 'none';
  document.getElementById('mFoot').innerHTML = foot;
  _wrap.classList.add('show');
}

/* ------------------------------------------------------------------ */

export const Modal = {

  /**
   * Promise-based confirmation dialog.
   * @returns {Promise<boolean>} true if user clicked the confirm button.
   */
  confirm({
    title        = 'Confirm',
    message      = '',
    warning      = null,
    confirmLabel = 'Confirm',
    cancelLabel  = 'Cancel',
  } = {}) {
    return new Promise(resolve => {
      _activeResolve = resolve;
      _show({
        title, message, warning,
        foot: `
          <button class="btn ghost" id="mCancel">${cancelLabel}</button>
          <button class="btn primary" id="mOk">${confirmLabel}</button>
        `,
      });
      document.getElementById('mCancel').onclick = () => {
        _hide(); resolve(false); _activeResolve = null;
      };
      document.getElementById('mOk').onclick = () => {
        _hide(); resolve(true); _activeResolve = null;
      };
    });
  },

  /**
   * Promise-based info / error alert (single OK button).
   * @returns {Promise<void>}
   */
  alert({ title = 'Notice', message = '' } = {}) {
    return new Promise(resolve => {
      _activeResolve = resolve;
      _show({
        title, message, warning: null,
        foot: `<button class="btn primary" id="mOk">OK</button>`,
      });
      document.getElementById('mOk').onclick = () => {
        _hide(); resolve(); _activeResolve = null;
      };
    });
  },

  /**
   * Toggle loading spinner on the active confirm button.
   * Call after Modal.confirm() opens — before awaiting user response
   * (e.g. show spinner while an async import is running in the background).
   */
  setLoading(loading) {
    if (!_wrap) return;
    const btn = document.getElementById('mOk');
    if (!btn) return;
    if (loading) {
      btn._origText  = btn.textContent;
      btn.disabled   = true;
      btn.innerHTML  = '<span class="modal-spinner"></span>';
    } else {
      btn.disabled   = false;
      btn.textContent = btn._origText || 'OK';
    }
  },
};
