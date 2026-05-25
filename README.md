# TradeOS

> AI-powered trading operating system — portfolio management, research, journaling, and decision support.

**Current version:** `v4.0.0` (Phase 3 — Google Sheets sync wired)
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
  sheets.js                  GAS adapter — fetchHoldings/Watchlist/Journal + alias normalize
/js/stores/
  holdings.js                holdings store + sync handler registration
  watchlist.js               watchlist store + sync handler registration
  journal.js                 journal store + sync handler registration
/js/domain/                  pure functions (fx, risk, portfolio, threats, format)
/js/charts/                  donut / bars / plbars / heatmap renderers
/modules/
  dashboard.js               live stats, threats, charts, movers, sync button
  holdings.js                live table, filters, manual add, demo (when API off)
  watchlist.js               live watchlist cards
  journal.js                 live journal entries
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

## Google Sheets schema (Phase 3)

The GAS script reads three tabs from its bound spreadsheet. **Sheet names
must match exactly.** The first row is the header row; column order doesn't
matter. Extra columns are ignored. Column names are matched case-insensitively
against the alias table in `js/sheets.js` (English, common broker variants,
and a few Simplified Chinese terms are accepted).

### `Holdings` sheet
| column      | aliases                                                            | required |
|-------------|--------------------------------------------------------------------|----------|
| `symbol`    | ticker · code · stock · 代码                                       | yes      |
| `qty`       | quantity · shares · units · position · 数量 · 持有数量             | yes      |
| `avgCost`   | avg cost · average cost · cost · cost basis · 成本价 · 平均成本价  | yes      |
| `lastPrice` | last price · last · price · market price · current · 现价          | yes      |
| `currency`  | ccy · 币种 (defaults to `USD`)                                     | no       |
| `name`      | company · 名称                                                     | no       |
| `risk`      | manual risk-class override                                         | no       |
| `note`      | per-position note                                                  | no       |

### `Watchlist` sheet
| column      | aliases                                              | required |
|-------------|------------------------------------------------------|----------|
| `ticker`    | symbol · code · 代码                                 | yes      |
| `priority`  | 优先级 (NORMAL / HIGH PRIORITY / SPECULATIVE)        | no       |
| `risk`      | risk class · 风险                                    | no       |
| `catalyst`  | 催化剂                                               | no       |
| `urgency`   | 紧迫度 (LOW / MEDIUM / HIGH)                         | no       |
| `note`      | thesis · notes · 备注 · 关注理由                     | no       |
| `added`     | date · 日期                                          | no       |

### `Journal` sheet
| column    | aliases                                            | required          |
|-----------|----------------------------------------------------|-------------------|
| `date`    | when · 日期                                        | yes (or ticker)   |
| `ticker`  | symbol · code · 代码                               | yes (or date)     |
| `action`  | side · op · 操作 (BUY / SELL / TRIM / ADD)         | no                |
| `reason`  | thesis · setup · rationale · 理由 · 计划           | no                |
| `emotion` | mood · feeling · 心理 · 情绪                       | no                |
| `lesson`  | takeaway · learned · 总结 · 教训                   | no                |

## Sync

- Auto-sync runs every **30 seconds** (configurable in Settings).
- Each tick: `ping` the API, then run every store's registered handler in
  sequence. Holdings, Watchlist, and Journal each register their own sync
  handler from their `init()`, so the loop pulls all three sheets per tick.
- Sync **pauses** while the PIN lock is engaged and **resumes** on unlock
  or on the `online` event after a connection drop.
- Manual sync: click the topbar sync pill, or use the **Refresh** button
  on Dashboard / Holdings / Watchlist / Journal.
- On API failure the last successful payload remains in `localStorage` —
  there is **no demo data fallback** (the Demo Data button on Holdings is
  hidden when the API is configured).

## Roadmap

- **Phase 4** — AI Lab port (prompt templates × engines), Ask Alpha, Compare.
- **Phase 5** — Write actions (holdings.upsert, journal.append, watchlist.add).
- **Phase 6** — Real-time quote provider integration, push notifications.
