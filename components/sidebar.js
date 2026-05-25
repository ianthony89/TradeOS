/* ============================================================
   TradeOS v4.0 — sidebar component
   Renders brand + 6 nav items + footer (version + theme/lang/lock).
   ============================================================ */

import { t, applyI18n } from '../js/i18n.js';
import * as Router from '../js/router.js';
import { getSettings } from '../js/storage.js';

const APP_VERSION = 'v4.0.0';

// Inline SVGs are tiny and avoid an extra fetch.
const ICONS = {
  dashboard:   '<svg class="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  holdings:    '<svg class="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 6-6"/></svg>',
  watchlist:   '<svg class="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  journal:     '<svg class="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h14a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2V4z"/><path d="M4 16h16"/><path d="M8 8h8"/></svg>',
  performance: '<svg class="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
  alerts:      '<svg class="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  ai:          '<svg class="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12h.01M12 12h.01M16 12h.01"/></svg>',
  planner:     '<svg class="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="12" y2="18"/></svg>',
  settings:    '<svg class="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
};

const SECTIONS = [
  {
    titleKey: 'nav_section_workspace',
    items: [
      { route: 'dashboard',   i18n: 'nav_dashboard',   icon: ICONS.dashboard   },
      { route: 'holdings',    i18n: 'nav_holdings',    icon: ICONS.holdings    },
      { route: 'watchlist',   i18n: 'nav_watchlist',   icon: ICONS.watchlist   },
      { route: 'journal',     i18n: 'nav_journal',     icon: ICONS.journal     },
      { route: 'performance', i18n: 'nav_performance', icon: ICONS.performance },
      { route: 'alerts',      i18n: 'nav_alerts',      icon: ICONS.alerts      },
    ],
  },
  {
    titleKey: 'nav_section_tools',
    items: [
      { route: 'planner',  i18n: 'nav_planner',  icon: ICONS.planner  },
      { route: 'ai',       i18n: 'nav_ai',       icon: ICONS.ai       },
      { route: 'settings', i18n: 'nav_settings', icon: ICONS.settings },
    ],
  },
];

export function mountSidebar() {
  const root = document.getElementById('sidebar');
  if (!root) return;

  const sectionsHtml = SECTIONS.map(sec => `
    <div class="nav-section" data-i18n="${sec.titleKey}">${t(sec.titleKey)}</div>
    ${sec.items.map(it => `
      <a class="nav-item" href="#/${it.route}" data-route="${it.route}">
        ${it.icon}
        <span class="nav-label" data-i18n="${it.i18n}">${t(it.i18n)}</span>
      </a>
    `).join('')}
  `).join('');

  root.innerHTML = `
    <div class="brand">
      <div class="brand-logo">T</div>
      <div class="brand-text">
        <div class="brand-title" data-i18n="app_title">${t('app_title')}</div>
        <div class="brand-sub" data-i18n="brand_sub">${t('brand_sub')}</div>
      </div>
      <button class="collapse-btn" id="sidebarCollapse" title="Collapse" aria-label="Collapse sidebar">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 6l-6 6 6 6"/></svg>
      </button>
    </div>
    ${sectionsHtml}
    <div class="sidebar-spacer"></div>
    <div class="sidebar-footer">
      <div class="row"><span>TradeOS</span><span>${APP_VERSION}</span></div>
      <div class="row muted">GitHub Pages · GAS</div>
    </div>
  `;

  // Bind collapse toggle.
  document.getElementById('sidebarCollapse').addEventListener('click', () => {
    document.querySelector('.app').classList.toggle('collapsed');
  });

  // Reflect active route.
  const updateActive = (name) => {
    root.querySelectorAll('.nav-item').forEach(a => {
      a.classList.toggle('active', a.dataset.route === name);
    });
  };
  Router.onChange(updateActive);
  if (Router.current()) updateActive(Router.current());

  applyI18n(root);
}
