/* ============================================================
   TradeOS v4.0 — domain/csvparser
   Pure CSV-parsing utilities.
   Auto-detects broker format (Moomoo, generic English, generic
   Chinese) and maps columns to the internal holdings schema.

   Returns { broker, rows, warnings } — never throws.
   ============================================================ */

/* ---- Broker header fingerprints ---- */
const BROKERS = [
  {
    name: 'Moomoo',
    // Must include at least 2 of these Chinese header tokens
    detect: (lowerHeaders) =>
      ['代码','持有数量','平均成本价'].filter(h => lowerHeaders.includes(h)).length >= 2,
  },
  {
    name: 'Tiger',
    detect: (lowerHeaders) =>
      ['股票代码','持仓数量','持仓均价'].filter(h => lowerHeaders.includes(h)).length >= 2,
  },
  {
    name: 'Interactive Brokers',
    detect: (lowerHeaders) =>
      lowerHeaders.includes('financial instrument') || lowerHeaders.includes('quantity') && lowerHeaders.includes('cost price'),
  },
  {
    name: 'Generic EN',
    detect: (lowerHeaders) =>
      lowerHeaders.includes('symbol') || lowerHeaders.includes('ticker'),
  },
  {
    name: 'Generic CN',
    detect: (lowerHeaders) =>
      lowerHeaders.includes('代码') || lowerHeaders.includes('股票代码'),
  },
];

/* ---- Column alias table (canonical → accepted lowercase variants) ---- */
const ALIASES = {
  symbol:    ['symbol','ticker','code','stock','代码','股票代码','证券代码','股票简称'],
  name:      ['name','company','company name','stock name','股票名称','名称','证券名称','简称'],
  qty:       ['qty','quantity','shares','units','position','volume','持有数量','数量','持仓数量','份额','数量(股)'],
  avgCost:   ['avgcost','avg cost','average cost','cost','cost price','avg price','book price','持仓均价',
               '平均成本价','成本价','均价','持仓成本','average price','buy price'],
  lastPrice: ['lastprice','last price','last','price','market price','current price','current','现价','最新价',
               '当前价','收盘价','close'],
  currency:  ['currency','ccy','币种','货币'],
};

/** Market detection from currency code */
export function marketFromCurrency(ccy) {
  const c = String(ccy || 'USD').toUpperCase().trim();
  if (c === 'MYR') return 'MY';
  if (c === 'HKD') return 'HK';
  if (c === 'SGD') return 'SG';
  if (c === 'CNY') return 'CN';
  if (c === 'AUD') return 'AU';
  if (c === 'GBP') return 'UK';
  return 'US';
}

/**
 * Parse a CSV string into holdings rows.
 *
 * @param {string} text   Raw CSV text (may have UTF-8 BOM)
 * @returns {{ broker:string, rows:object[], warnings:string[] }}
 */
export function parseCSV(text) {
  const warnings = [];

  // Strip UTF-8 BOM if present
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

  // Split into lines (handle \r\n, \r, \n)
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  // Find the header row: first non-empty line
  let headerLineIdx = 0;
  while (headerLineIdx < lines.length && !lines[headerLineIdx].trim()) headerLineIdx++;
  if (headerLineIdx >= lines.length) {
    return { broker: 'Unknown', rows: [], warnings: ['CSV is empty'] };
  }

  const rawHeaders = _parseLine(lines[headerLineIdx]);
  const lowerHeaders = rawHeaders.map(h => h.toLowerCase().trim());

  // Detect broker
  const matchedBroker = BROKERS.find(b => b.detect(lowerHeaders));
  const broker = matchedBroker ? matchedBroker.name : 'Unknown';

  // Build column index map: canonical → column index
  const colMap = {};
  for (const [canonical, candidates] of Object.entries(ALIASES)) {
    for (const c of candidates) {
      const idx = lowerHeaders.indexOf(c.toLowerCase());
      if (idx >= 0) {
        colMap[canonical] = idx;
        break;
      }
    }
  }

  if (colMap.symbol === undefined) {
    warnings.push('Could not find a symbol/ticker column in CSV headers.');
    return { broker, rows: [], warnings };
  }

  // Parse data rows
  const rows = [];
  const seenSymbols = new Set();

  for (let i = headerLineIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cells = _parseLine(lines[i]);

    const rawSymbol = _cell(cells, colMap.symbol);
    if (!rawSymbol) continue;

    // Skip rows that are clearly summary / total rows
    if (/^(total|合计|小计|汇总)/i.test(rawSymbol)) continue;

    const symbol = rawSymbol.toUpperCase().trim();
    if (!symbol) continue;

    const qty       = _num(_cell(cells, colMap.qty));
    const avgCost   = _num(_cell(cells, colMap.avgCost));
    const lastPrice = _num(_cell(cells, colMap.lastPrice));
    const currency  = (_cell(cells, colMap.currency) || 'USD').toUpperCase().trim() || 'USD';
    const name      = _cell(cells, colMap.name) || '';

    // Warn on duplicate symbols
    if (seenSymbols.has(symbol)) {
      warnings.push(`Duplicate symbol "${symbol}" — only the last row will be used.`);
    }
    seenSymbols.add(symbol);

    rows.push({ symbol, qty, avgCost, lastPrice, currency, name });
  }

  if (!rows.length) {
    warnings.push('No valid holdings rows found (all rows were skipped or empty).');
  }

  return { broker, rows, warnings };
}

/** Split a single CSV line, handling quoted fields with commas inside. */
function _parseLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if ((ch === ',' || ch === '\t') && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function _cell(cells, idx) {
  if (idx === undefined || idx < 0 || idx >= cells.length) return '';
  return String(cells[idx] || '').trim();
}

function _num(s) {
  if (!s) return 0;
  // Remove currency symbols, spaces, thousands commas inside number
  const clean = s.replace(/[^\d.\-]/g, '');
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}
