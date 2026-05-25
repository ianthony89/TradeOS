/* ============================================================
   TradeOS v4.0 — bootstrap entry point
   Wires every layer together on DOMContentLoaded:
     storage → theme → i18n → auth (lock gate)
     → init stores  → mount shell
     → register routes → start router
     → start sheet-sync (30s) → start quotes (60s)
   ============================================================ */

import { getSettings }            from './storage.js';
import { setLang, applyI18n }     from './i18n.js';
import * as Auth                  from './auth.js';
import * as Sync                  from './sync.js';
import * as Quotes                from './quotes.js';
import * as Router                from './router.js';
import { toast }                  from './toast.js';

// Stores (data layer)
import * as HoldingsStore  from './stores/holdings.js';
import * as WatchlistStore from './stores/watchlist.js';
import * as JournalStore   from './stores/journal.js';

// Shell components
import { mountSidebar }    from '../components/sidebar.js';
import { mountTopbar }     from '../components/topbar.js';

// Route modules (UI pages)
import * as DashboardPage from '../modules/dashboard.js';
import * as HoldingsPage  from '../modules/holdings.js';
import * as WatchlistPage from '../modules/watchlist.js';
import * as JournalPage   from '../modules/journal.js';
import * as AiPage        from '../modules/ai.js';
import * as SettingsPage  from '../modules/settings.js';

/* ---------- Route registration ---------- */

function _registerRoutes() {
  const stage = document.getElementById('stage');

  const make = (mod) => ({
    mount:   () => mod.mount(stage),
    unmount: () => mod.unmount(stage),
  });

  Router.register('dashboard', make(DashboardPage));
  Router.register('holdings',  make(HoldingsPage));
  Router.register('watchlist', make(WatchlistPage));
  Router.register('journal',   make(JournalPage));
  Router.register('ai',        make(AiPage));
  Router.register('settings',  make(SettingsPage));
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

  // 4. Init stores (load from local cache + register sync handlers).
  //    Order matters: stores must register before Sync.start() runs the
  //    first tick, otherwise the first sync won't pull anything.
  HoldingsStore.init();
  WatchlistStore.init();
  JournalStore.init();

  // 5. Reveal app shell, mount components
  document.getElementById('app').hidden = false;
  mountSidebar();
  mountTopbar();

  // 6. Register routes + start router
  _registerRoutes();
  Router.start();

  // 7. Start sheet-sync (default 30s) — pulls Holdings/Watchlist/Journal sheets
  Sync.setIntervalSec(s.syncIntervalSec || 30);
  Sync.start();

  // 8. Start live-quote engine (60s) — pulls prices for current holdings via GAS
  Quotes.setIntervalSec(s.quotesIntervalSec || 60);
  Quotes.start();
}

window.addEventListener('DOMContentLoaded', () => {
  bootstrap().catch((e) => {
    console.error('[TradeOS] bootstrap failed:', e);
    toast('Bootstrap failed: ' + (e.message || e), 'error', 6000);
  });
});
