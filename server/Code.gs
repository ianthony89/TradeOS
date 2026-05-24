/* ============================================================
   TradeOS v4.0 — Google Apps Script backend (starter template)
   Deploy as: Web App, Execute as: Me, Who has access: Anyone

   The web-app URL ends in /exec — paste that into TradeOS
   Settings → API & Sync → Endpoint URL.

   CORS NOTE:
   The TradeOS client POSTs with Content-Type: text/plain so the
   browser treats it as a "simple" CORS request — no OPTIONS
   preflight needed (GAS doesn't handle preflight cleanly).
   The body is JSON — we parse e.postData.contents ourselves.

   Wire format (request):
     { action: string, payload?: object, key?: string, ts?: number }
   Wire format (response):
     { ok: true,  data: <anything> }
     { ok: false, error: string }
   ============================================================ */

// Optional shared secret — if non-empty, requests must include
// the same value in body.key. Leave '' to disable.
var API_KEY = '';

// Phase 1: only 'ping' is wired. Add more actions here as TradeOS
// phases land. Each handler receives the parsed payload object.
var HANDLERS = {
  ping: function (payload) {
    return {
      ts: new Date().toISOString(),
      version: 'v4.0.0',
      server: 'google-apps-script',
    };
  },
  // Phase 2 will add: 'holdings.list', 'holdings.upsert', 'journal.append', ...
};

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

// doGet so visiting the URL in a browser shows a friendly status page
// instead of an opaque error during deployment testing.
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, data: { status: 'TradeOS API up', ts: new Date().toISOString() } }))
    .setMimeType(ContentService.MimeType.JSON);
}

function _respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
