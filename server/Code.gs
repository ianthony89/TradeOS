/* ============================================================
   TradeOS v4.0 — Google Apps Script backend
   Deploy as: Web App, Execute as: Me, Who has access: Anyone

   Setup:
     1. Bind this script to the spreadsheet that hosts your three sheets.
        (Apps Script editor → Project Settings → Script properties is
         NOT used — we use the BOUND spreadsheet of the script.)
        Easiest path: open your sheet → Extensions → Apps Script → paste this.
     2. Sheet names must be exactly:  Holdings  ·  Watchlist  ·  Journal
     3. First row of each sheet is a HEADER ROW (column names).
     4. Deploy → New deployment → Web app → Execute as: Me → Access: Anyone.
     5. Paste the /exec URL into TradeOS · Settings · API & Sync.

   Expected sheet columns (header row, case-insensitive — aliases handled
   client-side in js/sheets.js):

     Holdings:   symbol  qty  avgCost  lastPrice  currency  name
     Watchlist:  ticker  priority  risk  catalyst  urgency  note  added
     Journal:    date  ticker  action  reason  emotion  lesson

   Extra columns are ignored. Missing optional columns are tolerated.

   CORS NOTE:
   The TradeOS client POSTs with Content-Type: text/plain so the browser
   treats it as a "simple" CORS request — no OPTIONS preflight (GAS
   doesn't handle preflight cleanly). Body is JSON — parsed below.

   Wire format (request):
     { action: string, payload?: object, key?: string, ts?: number }
   Wire format (response):
     { ok: true,  data: <anything> }
     { ok: false, error: string }
   ============================================================ */

// Optional shared secret. If non-empty, every request must include `key`.
var API_KEY = '';

// Sheet name configuration — change these if your tabs are named differently.
var SHEETS = {
  holdings:  'Holdings',
  watchlist: 'Watchlist',
  journal:   'Journal',
};

// Alert sheet name — created automatically if missing.
var SHEETS_ALERTS = 'Alerts';

var HANDLERS = {
  ping: function () {
    return { ts: new Date().toISOString(), version: 'v4.0.0', server: 'gas' };
  },
  'holdings.list':  function ()        { return readSheet(SHEETS.holdings);  },
  'watchlist.list': function ()        { return readSheet(SHEETS.watchlist); },
  'journal.list':   function ()        { return readSheet(SHEETS.journal);   },
  'quotes.fetch':   function (payload) { return fetchQuotes(payload || {});  },
  // Phase 5
  'csv.import':     function (payload) { return importHoldingsCSV(payload || {}); },
  'alerts.list':    function ()        { return listAlerts();   },
  'alerts.save':    function (payload) { return saveAlert(payload || {}); },
  'alerts.delete':  function (payload) { return deleteAlert(payload || {}); },
  // Phase 5.3 — factory reset
  'reset.all':      function ()        { return resetAllSheets(); },
};

// --- Entry points ---

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return _respond({ ok: false, error: 'No request body' });
    }
    var req;
    try { req = JSON.parse(e.postData.contents); }
    catch (parseErr) { return _respond({ ok: false, error: 'Invalid JSON body' }); }

    if (API_KEY && req.key !== API_KEY) {
      return _respond({ ok: false, error: 'Unauthorized' });
    }

    var handler = HANDLERS[req.action];
    if (!handler) return _respond({ ok: false, error: 'Unknown action: ' + req.action });

    var data = handler(req.payload || {});
    return _respond({ ok: true, data: data });
  } catch (err) {
    return _respond({ ok: false, error: String(err && err.message || err) });
  }
}

function doGet(e) {
  return _respond({ ok: true, data: { status: 'TradeOS API up', ts: new Date().toISOString() } });
}

// --- Helpers ---

/**
 * Read a sheet by name and return an array of plain objects, keyed by header
 * row. Empty rows (no values at all) are skipped. Date columns are normalized
 * to ISO strings; Number/Boolean values pass through.
 */
function readSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('No bound spreadsheet — bind this script to a sheet via Extensions → Apps Script');
  var sh = ss.getSheetByName(name);
  if (!sh) throw new Error('Sheet not found: ' + name);

  var values = sh.getDataRange().getValues();
  if (!values || values.length < 2) return [];

  var headers = values[0].map(function (h) { return String(h || '').trim(); });
  var rows = [];
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    if (row.every(function (v) { return v === '' || v === null; })) continue;
    var o = {};
    for (var c = 0; c < headers.length; c++) {
      var key = headers[c];
      if (!key) continue;
      var val = row[c];
      if (val instanceof Date) val = val.toISOString();
      o[key] = val;
    }
    rows.push(o);
  }
  return rows;
}

function _respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ============================================================
   LIVE QUOTES — Phase 4
   Server-proxied so the browser never hits a CORS wall.

   Primary source: Yahoo Finance v7 endpoint (no key needed).
   Fallback:       Finnhub /quote — only used if YH fails and a
                   FINNHUB_TOKEN script property is set
                   (Apps Script editor → Project Settings → Script properties).

   Symbol mapping (canonical → Yahoo):
     BRK.B  → BRK-B
     5555   → 5555.KL  (Bursa Malaysia numeric)
     <sym>  → <sym>.KL if requested currency is MYR
     <sym>  → <sym>.HK if requested currency is HKD
   ============================================================ */

function fetchQuotes(payload) {
  var symbols = (payload && Array.isArray(payload.symbols)) ? payload.symbols : [];
  if (!symbols.length) return {};

  // Build canonical → yahoo map. Caller may also pass `meta: {SYM: {currency}}`
  // to inform the mapping; fall back to the heuristic on symbol alone.
  var meta = (payload && payload.meta) || {};
  var canonToYh = {};
  var yhToCanon = {};
  symbols.forEach(function (raw) {
    var canon = String(raw || '').toUpperCase().trim();
    if (!canon) return;
    var ccy = (meta[canon] && meta[canon].currency) || '';
    var yh = _toYahooSymbol(canon, ccy);
    canonToYh[canon] = yh;
    yhToCanon[yh] = canon;
  });

  var out = {};

  // Batch — Yahoo's URL can comfortably take 50+ comma-separated tickers
  var batchSize = 40;
  var allYh = Object.keys(yhToCanon);
  for (var i = 0; i < allYh.length; i += batchSize) {
    var batch = allYh.slice(i, i + batchSize);
    try {
      var yhData = _fetchYahooBatch(batch);
      for (var yhSym in yhData) {
        var canon = yhToCanon[yhSym] || yhSym;
        out[canon] = yhData[yhSym];
      }
    } catch (e) {
      // Whole batch failed — let the fallback try, one ticker at a time
    }
  }

  // Finnhub fallback for anything Yahoo didn't return
  var missing = Object.keys(canonToYh).filter(function (c) { return !out[c]; });
  if (missing.length) {
    var token = _finnhubToken();
    if (token) {
      missing.forEach(function (canon) {
        try {
          var q = _fetchFinnhubQuote(canon, token);
          if (q) out[canon] = q;
        } catch (e) { /* silently skip */ }
      });
    }
  }

  return out;
}

function _toYahooSymbol(symbol, currency) {
  var s = String(symbol).toUpperCase();
  // Already qualified with a Yahoo suffix
  if (/\.(KL|HK|TO|L|AX|TW|SS|SZ|SI)$/.test(s)) return s;
  // Berkshire-style class shares
  if (s === 'BRK.B') return 'BRK-B';
  if (s === 'BRK.A') return 'BRK-A';
  // Bursa Malaysia numeric ticker (e.g. 5555, 1023)
  if (/^\d{3,5}$/.test(s)) return s + '.KL';
  // Currency hint
  var ccy = (currency || '').toUpperCase();
  if (ccy === 'MYR') return s + '.KL';
  if (ccy === 'HKD') return s + '.HK';
  return s;
}

function _fetchYahooBatch(yhSymbols) {
  var url = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols='
          + encodeURIComponent(yhSymbols.join(','));
  var res = UrlFetchApp.fetch(url, {
    method: 'get',
    muteHttpExceptions: true,
    followRedirects: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (TradeOS/v4.0)',
      'Accept':     'application/json',
    },
  });
  var code = res.getResponseCode();
  if (code !== 200) throw new Error('Yahoo HTTP ' + code);
  var json;
  try { json = JSON.parse(res.getContentText()); }
  catch (e) { throw new Error('Yahoo: invalid JSON'); }

  var arr = (json && json.quoteResponse && json.quoteResponse.result) || [];
  var out = {};
  arr.forEach(function (q) {
    if (!q || !q.symbol) return;
    out[q.symbol] = {
      price:     q.regularMarketPrice,
      prevClose: q.regularMarketPreviousClose,
      change:    q.regularMarketChange,
      changePct: q.regularMarketChangePercent,
      currency:  q.currency,
      ts:        q.regularMarketTime ? q.regularMarketTime * 1000 : Date.now(),
      source:    'yahoo',
    };
  });
  return out;
}

function _finnhubToken() {
  try { return PropertiesService.getScriptProperties().getProperty('FINNHUB_TOKEN') || ''; }
  catch (e) { return ''; }
}

function _fetchFinnhubQuote(canonical, token) {
  // Finnhub uses bare US symbols. Non-US instruments need a different
  // endpoint we don't bother with — skip so we don't return bad data.
  if (/[\.\-]/.test(canonical) || /^\d/.test(canonical)) return null;
  var url = 'https://finnhub.io/api/v1/quote?symbol=' + encodeURIComponent(canonical)
          + '&token=' + encodeURIComponent(token);
  var res = UrlFetchApp.fetch(url, { method: 'get', muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return null;
  var j;
  try { j = JSON.parse(res.getContentText()); }
  catch (e) { return null; }
  if (!j || !j.c || j.c <= 0) return null;     // c = current price
  return {
    price:     j.c,
    prevClose: j.pc,
    change:    j.d,
    changePct: j.dp,
    currency:  'USD',
    ts:        j.t ? j.t * 1000 : Date.now(),
    source:    'finnhub',
  };
}

/* ============================================================
   PHASE 5 — CSV IMPORT
   Receives an array of { symbol, qty, avgCost, lastPrice,
   currency, name } objects and writes them to the Holdings
   sheet, preserving the header row.
   ============================================================ */

function importHoldingsCSV(payload) {
  var rows = payload && Array.isArray(payload.rows) ? payload.rows : [];
  if (!rows.length) throw new Error('csv.import: no rows provided');

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('No bound spreadsheet');
  var sh = ss.getSheetByName(SHEETS.holdings);
  if (!sh) throw new Error('Sheet not found: ' + SHEETS.holdings);

  // Read existing header row (row 1) so we don't destroy it
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  if (!headers || !headers.length || !headers[0]) {
    // Write a canonical header if the sheet is completely empty
    headers = ['symbol', 'qty', 'avgCost', 'lastPrice', 'currency', 'name'];
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  // Clear all data rows (keep header)
  var lastRow = sh.getLastRow();
  if (lastRow > 1) sh.getRange(2, 1, lastRow - 1, sh.getLastColumn()).clearContent();

  // Map our canonical fields to the header positions
  var lowerHeaders = headers.map(function (h) { return String(h || '').toLowerCase().trim(); });
  var fieldToCol = {
    symbol: _headerIdx(lowerHeaders, ['symbol','ticker','代码']),
    qty:    _headerIdx(lowerHeaders, ['qty','quantity','shares','数量','持有数量']),
    avgcost:_headerIdx(lowerHeaders, ['avgcost','avg cost','average cost','平均成本价','成本价']),
    lastprice:_headerIdx(lowerHeaders, ['lastprice','last price','price','现价','最新价']),
    currency: _headerIdx(lowerHeaders, ['currency','ccy','币种']),
    name:   _headerIdx(lowerHeaders, ['name','company','名称','股票名称']),
  };

  // Build data rows in header column order
  var dataRows = rows.map(function (r) {
    var row = new Array(headers.length).fill('');
    function _set(field, val) { var c = fieldToCol[field]; if (c >= 0) row[c] = val; }
    _set('symbol',    r.symbol || '');
    _set('qty',       r.qty    || 0);
    _set('avgcost',   r.avgCost || 0);
    _set('lastprice', r.lastPrice || 0);
    _set('currency',  r.currency || 'USD');
    _set('name',      r.name || '');
    return row;
  });

  if (dataRows.length) {
    sh.getRange(2, 1, dataRows.length, headers.length).setValues(dataRows);
  }

  return { imported: dataRows.length, sheet: SHEETS.holdings };
}

function _headerIdx(lowerHeaders, candidates) {
  for (var i = 0; i < candidates.length; i++) {
    var idx = lowerHeaders.indexOf(candidates[i].toLowerCase());
    if (idx >= 0) return idx;
  }
  return -1;
}

/* ============================================================
   PHASE 5 — ALERTS (Alerts sheet)
   Auto-creates the Alerts tab if missing.
   Schema: id | symbol | condition | target | status |
           created_at | triggered_at | notes
   ============================================================ */

var ALERTS_HEADERS = ['id','symbol','condition','target','status','created_at','triggered_at','notes'];

function _getOrCreateAlertsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('No bound spreadsheet');
  var sh = ss.getSheetByName(SHEETS_ALERTS);
  if (!sh) {
    sh = ss.insertSheet(SHEETS_ALERTS);
    sh.getRange(1, 1, 1, ALERTS_HEADERS.length).setValues([ALERTS_HEADERS]);
  }
  return sh;
}

function listAlerts() {
  var sh = _getOrCreateAlertsSheet();
  var vals = sh.getDataRange().getValues();
  if (!vals || vals.length < 2) return [];
  var headers = vals[0].map(function (h) { return String(h || '').toLowerCase().trim(); });
  return vals.slice(1).filter(function (r) { return r[0]; }).map(function (r) {
    var o = {};
    headers.forEach(function (h, i) { o[h] = r[i]; });
    return o;
  });
}

function saveAlert(payload) {
  // Upsert by id. If no matching id, append a new row.
  if (!payload || !payload.id) throw new Error('alerts.save: missing id');
  var sh = _getOrCreateAlertsSheet();
  var vals = sh.getDataRange().getValues();
  var headers = vals[0].map(function (h) { return String(h || '').toLowerCase().trim(); });
  var idCol = headers.indexOf('id');
  if (idCol < 0) throw new Error('Alerts sheet missing id column');

  // Build row array from payload
  var row = ALERTS_HEADERS.map(function (h) {
    return payload[h] !== undefined ? String(payload[h]) : '';
  });

  // Look for existing row
  for (var r = 1; r < vals.length; r++) {
    if (String(vals[r][idCol]) === String(payload.id)) {
      sh.getRange(r + 1, 1, 1, row.length).setValues([row]);
      return { saved: true, row: r + 1 };
    }
  }
  // Append new row
  sh.appendRow(row);
  return { saved: true, row: sh.getLastRow() };
}

function deleteAlert(payload) {
  if (!payload || !payload.id) throw new Error('alerts.delete: missing id');
  var sh = _getOrCreateAlertsSheet();
  var vals = sh.getDataRange().getValues();
  var headers = vals[0].map(function (h) { return String(h || '').toLowerCase().trim(); });
  var idCol = headers.indexOf('id');
  if (idCol < 0) throw new Error('Alerts sheet missing id column');

  for (var r = 1; r < vals.length; r++) {
    if (String(vals[r][idCol]) === String(payload.id)) {
      sh.deleteRow(r + 1);
      return { deleted: true };
    }
  }
  return { deleted: false };
}

/* ============================================================
   PHASE 5.3 — FACTORY RESET
   Clears all data rows (preserves header row) in every tracked
   sheet: Holdings, Watchlist, Journal, Alerts.
   Missing sheets are silently skipped (nothing to clear).
   ============================================================ */

function resetAllSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('No bound spreadsheet');

  var targets = [SHEETS.holdings, SHEETS.watchlist, SHEETS.journal, SHEETS_ALERTS];
  var cleared = [];
  var skipped = [];

  targets.forEach(function (name) {
    var sh = ss.getSheetByName(name);
    if (!sh) { skipped.push(name); return; }
    var lastRow = sh.getLastRow();
    if (lastRow > 1) {
      sh.getRange(2, 1, lastRow - 1, sh.getLastColumn()).clearContent();
      cleared.push(name);
    }
  });

  return { cleared: cleared, skipped: skipped };
}
