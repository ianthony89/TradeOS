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

var HANDLERS = {
  ping: function () {
    return { ts: new Date().toISOString(), version: 'v4.0.0', server: 'gas' };
  },
  'holdings.list':  function ()        { return readSheet(SHEETS.holdings);  },
  'watchlist.list': function ()        { return readSheet(SHEETS.watchlist); },
  'journal.list':   function ()        { return readSheet(SHEETS.journal);   },
  'quotes.fetch':   function (payload) { return fetchQuotes(payload || {});  },
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
