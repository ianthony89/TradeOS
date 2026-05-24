# TradeOS

> AI-powered trading operating system — portfolio management, research, journaling, and decision support.

**Current version:** `v4.0.0` (Phase 1 — architecture + shell)
**Predecessor:** v3.7 archived at [`legacy/v3.7.html`](legacy/v3.7.html) — source of truth for ported design tokens, i18n strings, market-session logic, CSV parser, AI prompt library.

---

## Stack

- Pure HTML / CSS / Vanilla JavaScript (ES modules)
- Hosted on **GitHub Pages**
- Backend: **Google Apps Script** Web App → Google Sheets
- No framework. No bundler. No build step.

---

## Project layout

```
/index.html                  shell + lock screen + mount points
/css/
  themes.css                 design tokens — dark default, light opt-in
  main.css                   base, layout, components, lock, sync pill
/components/
  sidebar.js                 6-route nav, brand, collapse
  topbar.js                  greeting, US/MY clocks, sync pill, lang/theme/lock
  modal.js                   single-overlay modal helper
/js/
  app.js                     bootstrap — wires every layer in order
  router.js                  hash router (#/dashboard, #/holdings, …)
  api.js                     Google Apps Script client (CORS-safe POST)
  storage.js                 namespaced localStorage (tradeos.v4.*)
  auth.js                    PIN hash + lock screen control
  sync.js                    30s auto-sync engine + status event bus
  i18n.js                    en/zh dictionary + market session helpers
  toast.js                   notification stack
/modules/
  dashboard.js               Phase 1 stub
  holdings.js                Phase 1 stub
  watchlist.js               Phase 1 stub
  journal.js                 Phase 1 stub
  ai.js                      Phase 1 stub
  settings.js                Phase 1 — real (PIN, API, theme, lang, sync)
/server/
  Code.gs                    Google Apps Script backend template
/legacy/
  v3.7.html                  archived monolith — porting source
```

---

## Phase 1 — what's wired

- [x] **PIN lock screen** — SHA-256 salted hash in localStorage; 4–8 digits; create / enter / confirm flows; on-screen + keyboard input; "Forget PIN" wipes local data.
- [x] **Dark mode default** (light theme available via Settings).
- [x] **EN / ZH language toggle** — topbar button + Settings dropdown; full v3.7 dictionary ported + Phase 1 additions.
- [x] **Google Apps Script API client** — POSTs `text/plain` to dodge CORS preflight; built-in `ping`; configurable endpoint + optional API key; test button in Settings.
- [x] **30s auto-sync engine** — registry pattern (`sync.register(name, fn)`) for Phase 2+ modules; pauses while locked; resumes on unlock or `online` event.
- [x] **Sync status indicator** — topbar pill: `idle / syncing / ok / error / offline / unconfigured`; click to force immediate sync.
- [x] **Sidebar navigation** — 6 routes with active highlight + collapse; mobile drawer.
- [x] **Top dashboard shell** — greeting, US + Malaysia clocks (DST-safe via `Intl`), session pills, sync pill, lang/theme/lock buttons.

**Not in Phase 1 (intentionally):** holdings, watchlist, journal, AI Lab, CSV import, charts. Those land in Phase 2+.

---

## Setup

### 1. Deploy the backend

1. Open [script.google.com](https://script.google.com) → New project.
2. Replace `Code.gs` with the contents of [`server/Code.gs`](server/Code.gs).
3. (Optional) set `API_KEY = '…'` to require a shared secret.
4. Deploy → New deployment → **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the deployment URL (ends in `/exec`).

### 2. Configure TradeOS

1. Open the GitHub Pages URL (or `index.html` via any static server).
2. Create your PIN on first launch.
3. Go to **Settings → API & Sync**, paste the deployment URL, optionally the API key, click **Test Connection** → expect `Connection OK · <ms> ms`.
4. Click **Save API Settings**. The sync pill in the topbar will start flipping `syncing → ok` every 30 seconds.

### 3. Run locally (optional)

ES modules need real HTTP, not `file://`:

```bash
# any static server works
python -m http.server 8080
# or
npx serve .
```

Then open <http://localhost:8080>.

---

## Architecture notes

- **No globals.** Each module exports its API; everything is wired via ES module imports.
- **Storage is namespaced.** All keys live under `tradeos.v4.*` — no collision with v3.7 (`atcc.v3.*`) data on the same origin.
- **PIN is a *device* gate**, not a server auth. Stored as a salted SHA-256 hash — sufficient to deter casual inspection, not a determined attacker who already controls the device.
- **Sync = registry.** `sync.register('holdings', async () => { … })` from any Phase 2 module hooks it into the 30s loop automatically. Pings the API first; only runs handlers if ping succeeds.
- **No build step.** The browser fetches `js/app.js` as a module, which resolves the rest of the dependency graph via relative imports. GitHub Pages serves the right MIME types out of the box.

---

## Roadmap

- **Phase 2** — Holdings module (storage shape, CSV import port, dashboard stats wire-up, GAS `holdings.list` / `holdings.upsert` actions).
- **Phase 3** — Watchlist, Journal, Thesis Vault — with sync handlers.
- **Phase 4** — AI Lab port (prompt templates × engines), Ask Alpha, Compare.
- **Phase 5** — Charts (donut, bars, P/L, heatmap), threat engine, posture engine.
- **Phase 6** — Real-time quote provider integration, push notifications.
