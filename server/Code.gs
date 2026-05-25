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
  'holdings.list':  function () { return readSheet(SHEETS.holdings);  },
  'watchlist.list': function () { return readSheet(SHEETS.watchlist); },
  'journal.list':   function () { return readSheet(SHEETS.journal);   },
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
