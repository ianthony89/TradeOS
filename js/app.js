/* ============================================================
   TradeOS v4.0 — bootstrap entry point
   Wires every layer together on DOMContentLoaded:
     storage → theme → i18n → auth (lock gate) → mount shell
     → register routes → start router → start sync engine
   ============================================================ */

import { getSettings }            from './storage.js';
import { setLang, applyI18n }     from './i18n.js';
import * as Auth                  from './auth.js';
import * as Sync                  from './sync.js';
import * as Router                from './router.js';
import * as State                 from './state.js';
import { toast }                  from './toast.js';
import { mountSidebar }           from '../components/sidebar.js';
import { mountTopbar }            from '../components/topbar.js';
import * as Dashboard from '../modules/dashboard.js';
import * as Holdings  from '../modules/holdings.js';
import * as Watchlist from '../modules/watchlist.js';
import * as Journal   from '../modules/journal.js';
import * as Ai        from '../modules/ai.js';
import * as Settings  from '../modules/settings.js';

/* ---------- Route registration ---------- */

function _registerRoutes() {
  const stage = document.getElementById('stage');

  const make = (mod) => ({
    mount:   () => mod.mount(stage),
    unmount: () => mod.unmount(stage),
  });

  Router.register('dashboard', make(Dashboard));
  Router.register('holdings',  make(Holdings));
  Router.register('watchlist', make(Watchlist));
  Router.register('journal',   make(Journal));
  Router.register('ai',        make(Ai));
  Router.register('settings',  make(Settings));
  Router.setDefault('dashboard');
}

/* ---------- Bootstrap ---------- */

async function bootstrap() {
  // 1. Settings → theme + lang (must run before any render)
  const s = getSettings();
  document.documentElement.setAttribute('data-theme', s.theme || 'dark');
  setLang(s.lang || 'en');
  applyI18n();

  // 2. Auth init (binds keyboard, visibilitychange listener)
  Auth.initAuth();

  // 3. Lock gate. Always shown on first paint:
  //    - first run (no PIN): create-PIN flow
  //    - returning user: enter-PIN flow
  await Auth.showLock();

  // 4. Load holdings from storage (recomputes derived fields)
  State.init();

  // 5. Reveal app shell, mount components
  document.getElementById('app').hidden = false;
  mountSidebar();
  mountTopbar();

  // 6. Register routes + start router
  _registerRoutes();
  Router.start();

  // 7. Start sync engine (uses configured interval if any)
  Sync.setIntervalSec(s.syncIntervalSec || 30);
  Sync.start();
}

window.addEventListener('DOMContentLoaded', () => {
  bootstrap().catch((e) => {
    console.error('[TradeOS] bootstrap failed:', e);
    toast('Bootstrap failed: ' + (e.message || e), 'error', 6000);
  });
});
