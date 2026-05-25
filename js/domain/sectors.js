/* ============================================================
   TradeOS v4.0 — domain/sectors
   Lightweight ticker → sector classifier. Hardcoded for the most
   common holdings; everything else falls into OTHER.

   Used by the threat engine to detect single-sector concentration
   and correlated-position clusters.
   ============================================================ */

const TABLE = {
  // Semis
  SEMIS: ['NVDA','AMD','AVGO','ASML','TSM','MU','ARM','MRVL','SMCI','SOXL','SOXS','SOXX','NVDL','NVDU','NVDS','AMDL','SMH','SMCX'],
  // Mega-cap tech (BigTech)
  BIGTECH: ['AAPL','MSFT','GOOGL','GOOG','META','AMZN','NFLX'],
  // Software / SaaS
  SOFTWARE: ['CRWD','SNOW','NET','DDOG','SHOP','PLTR','MDB','NOW','TEAM','ZS','PANW','S','OKTA'],
  // EV / mobility
  EV: ['TSLA','RIVN','LCID','NIO','LI','XPEV'],
  // Fintech / payments
  FINTECH: ['V','MA','SQ','PYPL','SOFI','HOOD','COIN','AFRM'],
  // Banks / financials
  BANKS: ['JPM','BAC','WFC','GS','MS','C','TFC','PNC','USB'],
  // Healthcare / pharma
  HEALTH: ['JNJ','UNH','ABBV','LLY','PFE','MRK','TMO','ABT','BMY','GILD','AMGN'],
  // Consumer staples
  STAPLES: ['KO','PEP','PG','COST','WMT','MO','PM','CL','KMB'],
  // Energy
  ENERGY: ['XOM','CVX','COP','OXY','SLB','EOG','PSX','MPC','VLO'],
  // Crypto-adjacent
  CRYPTO: ['COIN','MSTR','MSTU','MSTZ','CONL','MSTX','BITX','ETHU','BITI'],
  // AI / Data infra
  AI: ['NVDA','SMCI','AVGO','PLTR','ARM','TSM'],          // intentional overlap with SEMIS — flagged via SEMIS first
  // Broad index ETFs (NOT a sector — neutralizes concentration detection)
  INDEX: ['SPY','VOO','QQQ','VTI','DIA','IWM','VEA','VWO','BND','TLT','SCHD','VYM'],
  // Leveraged trio (treat as their own correlated bucket)
  LEVERAGED_INDEX: ['TQQQ','SQQQ','UPRO','SPXU','UDOW','SDOW','TNA','TZA','SPXL'],
};

// Reverse map: ticker (upper) -> first matching sector
const REVERSE = (() => {
  const m = {};
  // Order matters — first hit wins. SEMIS before AI so NVDA classifies as SEMIS.
  const order = ['INDEX','LEVERAGED_INDEX','SEMIS','BIGTECH','SOFTWARE','EV','FINTECH','BANKS','HEALTH','STAPLES','ENERGY','CRYPTO','AI'];
  for (const sec of order) {
    for (const sym of TABLE[sec]) {
      if (!(sym in m)) m[sym] = sec;
    }
  }
  return m;
})();

export const SECTORS = Object.keys(TABLE);

export function classifySector(symbol) {
  const s = String(symbol || '').toUpperCase().trim();
  if (REVERSE[s]) return REVERSE[s];
  // Bursa numeric tickers — no sector data → OTHER
  return 'OTHER';
}

/** Market-value totals per sector. INDEX is excluded from concentration math. */
export function sectorBuckets(holdings) {
  const out = {};
  (holdings || []).forEach(h => {
    const sec = classifySector(h.symbol);
    out[sec] = (out[sec] || 0) + (h.marketValue || 0);
  });
  return out;
}

/** Return [{sector, value, pct}] sorted desc, excluding INDEX. */
export function rankSectors(holdings, totalPortfolio) {
  const b = sectorBuckets(holdings);
  delete b.INDEX;                              // diversified ETFs don't count
  const entries = Object.entries(b)
    .filter(([, v]) => v > 0)
    .map(([sector, value]) => ({
      sector,
      value,
      pct: totalPortfolio > 0 ? (value / totalPortfolio) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
  return entries;
}
