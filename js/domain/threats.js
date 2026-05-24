/* ============================================================
   TradeOS v4.0 — domain/threats
   Detection rules + risk-score aggregation. Pure. Returns
   *i18n keys* (not translated strings) so the UI layer can
   render them in the current language without re-computing.

   Ported rules from v3.7. Translation happens in components/threat.js.
   ============================================================ */

import { getStats } from './portfolio.js';

export const DEFAULT_RISK_THRESHOLDS = {
  levWarn: 30,
  levCrit: 50,
  conc:    40,   // concentration single-name limit, in %
  spec:    35,
};

/**
 * @param {Array}  holdings  recomputed holdings
 * @param {object} settings  { risk: {levWarn, levCrit, conc, spec}, cash, ... }
 * @returns {{ list: Array, riskScore: number, stats: object }}
 *
 * Each list entry: { tone, ico, severityKey, titleKey, msgKey?, msgVars?, msgHtml? }
 *   - tone: 'crit' | 'warn' | 'info' | 'ok'
 *   - When msgHtml is set, the UI uses it verbatim (already HTML-safe).
 *   - When msgKey is set, the UI translates and substitutes msgVars.
 */
export function detectThreats(holdings, settings) {
  const T = { ...DEFAULT_RISK_THRESHOLDS, ...(settings && settings.risk) };
  const stats = getStats(holdings, settings);
  const list = [];
  let riskScore = 0;

  if (!holdings.length) {
    list.push({
      tone: 'info', ico: 'i',
      severityKey: 'sev_idle',
      titleKey: 'threat_no_portfolio_t',
      msgKey: 'threat_no_portfolio_m',
    });
    return { list, riskScore: 0, stats };
  }

  // 1. Leveraged exposure
  if (stats.levPct >= T.levCrit) {
    list.push({
      tone: 'crit', ico: '!',
      severityKey: 'sev_critical',
      titleKey: 'threat_lev_crit_t',
      msgHtml: `${stats.levPct.toFixed(1)}% (limit: ${T.levCrit}%)`,
    });
    riskScore += 35;
  } else if (stats.levPct >= T.levWarn) {
    list.push({
      tone: 'warn', ico: '⚠',
      severityKey: 'sev_warning',
      titleKey: 'threat_lev_warn_t',
      msgHtml: `${stats.levPct.toFixed(1)}% (threshold: ${T.levWarn}%)`,
    });
    riskScore += 18;
  }

  // 2. Speculation overload
  if (stats.specPct >= T.spec) {
    list.push({
      tone: 'warn', ico: '⚠',
      severityKey: 'sev_warning',
      titleKey: 'threat_spec_t',
      msgKey: 'threat_spec_m',
      msgVars: { pct: stats.specPct.toFixed(1) },
      msgPrefix: `${stats.specPct.toFixed(1)}% `,
    });
    riskScore += 15;
  }

  // 3. Concentration on single name
  const sortedByMV = [...holdings].sort((a, b) => b.marketValue - a.marketValue);
  if (sortedByMV.length && stats.portfolio > 0) {
    const top = sortedByMV[0];
    const concPct = (top.marketValue / stats.portfolio) * 100;
    if (concPct >= T.conc + 15) {
      list.push({
        tone: 'crit', ico: '!',
        severityKey: 'sev_critical',
        titleKey: 'threat_conc_extreme_t',
        msgHtml: `<strong>${escapeHtml(top.symbol)}</strong> = ${concPct.toFixed(1)}%`,
      });
      riskScore += 25;
    } else if (concPct >= T.conc) {
      list.push({
        tone: 'warn', ico: '◆',
        severityKey: 'sev_warning',
        titleKey: 'threat_conc_warn_t',
        msgHtml: `<strong>${escapeHtml(top.symbol)}</strong> = ${concPct.toFixed(1)}% (limit: ${T.conc}%)`,
      });
      riskScore += 12;
    }
  }

  // 4. Dead positions
  const dead = holdings.filter(h => h.status === 'DEAD');
  if (dead.length >= 3) {
    list.push({
      tone: 'crit', ico: '×',
      severityKey: 'sev_critical',
      titleKey: 'threat_dead_crit_t',
      msgHtml: `${dead.length} × DEAD: <strong>${dead.slice(0, 4).map(d => escapeHtml(d.symbol)).join(', ')}</strong>`,
    });
    riskScore += 20;
  } else if (dead.length > 0) {
    list.push({
      tone: 'warn', ico: '×',
      severityKey: 'sev_warning',
      titleKey: 'threat_dead_warn_t',
      msgHtml: `${dead.length} × ${dead.map(d => escapeHtml(d.symbol)).join(', ')}`,
    });
    riskScore += 8;
  }

  // 5. Weak positions
  const weak = holdings.filter(h => h.status === 'WEAK').length;
  if (weak >= 4) {
    list.push({
      tone: 'warn', ico: '△',
      severityKey: 'sev_warning',
      titleKey: 'threat_weak_t',
      msgKey: 'threat_weak_m',
      msgPrefix: `${weak} `,
    });
    riskScore += 10;
  }

  // 6. Loss-heavy book
  if (stats.totalPL < 0 && stats.winners > 0 && stats.losers > stats.winners * 2) {
    list.push({
      tone: 'warn', ico: '⚠',
      severityKey: 'sev_warning',
      titleKey: 'threat_loss_t',
      msgHtml: `${stats.losers} ↓ / ${stats.winners} ↑`,
    });
    riskScore += 12;
  }

  // 7. Cash buffer
  if (stats.cash <= 0 && holdings.length > 0) {
    list.push({
      tone: 'info', ico: '$',
      severityKey: 'sev_info',
      titleKey: 'threat_cash_t',
      msgKey: 'threat_cash_m',
    });
    riskScore += 5;
  } else if (stats.portfolio > 0 && (stats.cash / stats.portfolio) > 0.5) {
    list.push({
      tone: 'info', ico: '$',
      severityKey: 'sev_info',
      titleKey: 'threat_highcash_t',
      msgKey: 'threat_highcash_m',
      msgPrefix: `${((stats.cash / stats.portfolio) * 100).toFixed(0)}% `,
    });
  }

  // 8. Big winners — lock in
  const bigWinners = holdings.filter(h => h.plPct > 30 && h.risk !== 'CORE');
  if (bigWinners.length > 0) {
    list.push({
      tone: 'info', ico: '↑',
      severityKey: 'sev_opportunity',
      titleKey: 'threat_locks_t',
      msgKey: 'threat_locks_m',
      msgPrefix: `${bigWinners.map(b => escapeHtml(b.symbol)).join(', ')} `,
    });
  }

  // 9. Portfolio performing
  if (stats.totalPL > 0 && stats.totalPLPct > 25) {
    list.push({
      tone: 'ok', ico: '✓',
      severityKey: 'sev_strong',
      titleKey: 'threat_strong_t',
      msgKey: 'threat_strong_m',
      msgPrefix: `+${stats.totalPLPct.toFixed(1)}% `,
    });
  }

  // 10. Multiple criticals → escalation
  const numCrit = list.filter(l => l.tone === 'crit').length;
  if (numCrit >= 2) riskScore += 15;

  riskScore = Math.min(100, riskScore);

  // Front-load with "balanced" when score is low and nothing else fired
  if (riskScore < 20 && list.length <= 1) {
    list.unshift({
      tone: 'ok', ico: '✓',
      severityKey: 'sev_nominal',
      titleKey: 'threat_balanced_t',
      msgKey: 'threat_balanced_m',
    });
  }

  return { list, riskScore, stats };
}

export function riskScoreBucket(score) {
  if (score < 25) return 'low';
  if (score < 55) return 'moderate';
  if (score < 80) return 'high';
  return 'extreme';
}

// Local — not exported. Used only for inline HTML composition above.
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
