/* ============================================================
   TradeOS v4.0 — dashboard module (Phase 1 shell)
   Real content lands in Phase 2 once holdings storage exists.
   ============================================================ */

import { t, applyI18n } from '../js/i18n.js';

export function mount(root) {
  root.innerHTML = `
    <div class="grid-4">
      <div class="stat">
        <div class="lbl" data-i18n="stat_portfolio">${t('stat_portfolio')}</div>
        <div class="val">—</div>
        <div class="sub muted">Phase 2</div>
      </div>
      <div class="stat">
        <div class="lbl" data-i18n="stat_pl">${t('stat_pl')}</div>
        <div class="val">—</div>
        <div class="sub muted">Phase 2</div>
      </div>
      <div class="stat">
        <div class="lbl" data-i18n="stat_risk">${t('stat_risk')}</div>
        <div class="val">—</div>
        <div class="sub muted">Phase 2</div>
      </div>
      <div class="stat">
        <div class="lbl" data-i18n="stat_cash">${t('stat_cash')}</div>
        <div class="val">—</div>
        <div class="sub muted">Phase 2</div>
      </div>
    </div>

    <div class="panel mt-18">
      <div class="panel-head">
        <h3 data-i18n="nav_dashboard">${t('nav_dashboard')}</h3>
        <span class="muted">Phase 1 shell</span>
      </div>
      <div class="panel-body">
        <div class="empty">
          <div class="emo">⚡</div>
          <div class="ttl" data-i18n="coming_soon_t">${t('coming_soon_t')}</div>
          <div class="sub" data-i18n="coming_soon_s">${t('coming_soon_s')}</div>
        </div>
      </div>
    </div>
  `;
  applyI18n(root);
}

export function unmount(root) { root.innerHTML = ''; }
