/* ============================================================
   TradeOS v4.0 — AI module (Phase 1 stub)
   The v3.7 prompt template library + engine selector will be
   ported here in Phase 2.
   ============================================================ */

import { t, applyI18n } from '../js/i18n.js';

export function mount(root) {
  root.innerHTML = `
    <div class="panel">
      <div class="panel-head">
        <h3 data-i18n="nav_ai">${t('nav_ai')}</h3>
        <span class="muted">Phase 1 shell</span>
      </div>
      <div class="panel-body">
        <div class="empty">
          <div class="emo">🧠</div>
          <div class="ttl" data-i18n="coming_soon_t">${t('coming_soon_t')}</div>
          <div class="sub" data-i18n="coming_soon_s">${t('coming_soon_s')}</div>
        </div>
      </div>
    </div>
  `;
  applyI18n(root);
}

export function unmount(root) { root.innerHTML = ''; }
