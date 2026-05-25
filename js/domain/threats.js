/* ============================================================
   TradeOS v4.0 — domain/threats
   Detection rules + risk-score aggregation. Pure. Returns *i18n keys*
   (not translated strings) so the UI layer can render in the current
   language without re-computing.

   Phase 4 additions:
     - drawdown rule
     - sector-concentration rule (single sector > sectorConc%)
     - correlated-positions rule (top-3 holdings cluster in one bucket)
     - actionKey on every threat — surfaced as "recommended action"
   ============================================================ */

import { getStats } from './portfolio.js';
import { rankSectors, classifySector } from './sectors.js';

export const DEFAULT_RISK_THRESHOLDS = {
  levWarn:    30,
  levCrit:    50,
  conc:       40,   // single-name concentration limit, %
  spec:       35,
  sectorConc: 40,   // single-sector concentration limit, %
  drawdown:   15,   // portfolio drawdown % to trigger threat
};

/**
 * Each list entry: { tone, ico, severityKey, titleKey, msgKey?, msgVars?,
 *                    msgHtml?, msgPrefix?, actionKey? }
 *   - tone: 'crit' | 'warn' | 'info' | 'ok'
 *   - msgHtml is used verbatim (already HTML-safe)
 *   - msgKey is translated and substituted with msgVars
 *   - actionKey points to a recommended-action i18n string
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
      actionKey: 'action_lev_crit',
    });
    riskScore += 35;
  } else if (stats.levPct >= T.levWarn) {
    list.push({
      tone: 'warn', ico: '⚠',
      severityKey: 'sev_warning',
      titleKey: 'threat_lev_warn_t',
      msgHtml: `${stats.levPct.toFixed(1)}% (threshold: ${T.levWarn}%)`,
      actionKey: 'action_lev_warn',
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
      msgPrefix: `${stats.specPct.toFixed(1)}% `,
      actionKey: 'action_spec',
    });
    riskScore += 15;
  }

  // 3. Single-name concentration
  const sortedByMV = [...holdings].sort((a, b) => b.marketValue - a.marketValue);
  if (sortedByMV.length && stats.portfolio > 0) {
    const top = sortedByMV[0];
    const concPct = (top.marketValue / stats.portfolio) * 100;
    if (concPct >= T.conc + 15) {
      list.push({
        tone: 'crit', ico: '!',
        severityKey: 'sev_critical',
        titleKey: 'threat_conc_extreme_t',
        msgHtml: `<strong>${esc(top.symbol)}</strong> = ${concPct.toFixed(1)}%`,
        actionKey: 'action_conc_extreme',
      });
      riskScore += 25;
    } else if (concPct >= T.conc) {
      list.push({
        tone: 'warn', ico: '◆',
        severityKey: 'sev_warning',
        titleKey: 'threat_conc_warn_t',
        msgHtml: `<strong>${esc(top.symbol)}</strong> = ${concPct.toFixed(1)}% (limit: ${T.conc}%)`,
        actionKey: 'action_conc_warn',
      });
      riskScore += 12;
    }
  }

  // 4. Sector concentration (Phase 4 — new)
  const sectors = rankSectors(holdings, stats.portfolio);
  if (sectors.length && sectors[0].pct >= T.sectorConc) {
    const s = sectors[0];
    const tone  = s.pct >= T.sectorConc + 15 ? 'crit' : 'warn';
    const sevK  = tone === 'crit' ? 'sev_critical' : 'sev_warning';
    const titleK = tone === 'crit' ? 'threat_sector_crit_t' : 'threat_sector_warn_t';
    list.push({
      tone, ico: '◆',
      severityKey: sevK,
      titleKey: titleK,
      msgHtml: `<strong>${esc(s.sector)}</strong> = ${s.pct.toFixed(1)}% (limit: ${T.sectorConc}%)`,
      actionKey: 'action_sector',
    });
    riskScore += tone === 'crit' ? 22 : 12;
  }

  // 5. Correlated positions (Phase 4 — new)
  //    Top-3 holdings all in the same sector OR all LEVERAGED.
  if (sortedByMV.length >= 3) {
    const top3 = sortedByMV.slice(0, 3);
    const sameSector = top3.every(h => classifySector(h.symbol) === classifySector(top3[0].symbol))
      && classifySector(top3[0].symbol) !== 'OTHER'
      && classifySector(top3[0].symbol) !== 'INDEX';
    const allLeveraged = top3.every(h => h.risk === 'LEVERAGED');
    if (sameSector || allLeveraged) {
      const reasonHtml = sameSector
        ? `${esc(top3.map(h => h.symbol).join(', '))} · ${esc(classifySector(top3[0].symbol))}`
        : `${esc(top3.map(h => h.symbol).join(', '))} · LEVERAGED`;
      list.push({
        tone: 'warn', ico: '⇌',
        severityKey: 'sev_warning',
        titleKey: 'threat_correlated_t',
        msgHtml: reasonHtml,
        actionKey: 'action_correlated',
      });
      riskScore += 14;
    }
  }

  // 6. Drawdown (Phase 4 — new)
  if (stats.totalPLPct <= -T.drawdown && stats.totalCost > 0) {
    const tone = stats.totalPLPct <= -T.drawdown - 10 ? 'crit' : 'warn';
    const sevK = tone === 'crit' ? 'sev_critical' : 'sev_warning';
    list.push({
      tone, ico: '↓',
      severityKey: sevK,
      titleKey: 'threat_drawdown_t',
      msgHtml: `${stats.totalPLPct.toFixed(1)}% (limit: −${T.drawdown}%)`,
      actionKey: 'action_drawdown',
    });
    riskScore += tone === 'crit' ? 22 : 14;
  }

  // 7. Dead positions
  const dead = holdings.filter(h => h.status === 'DEAD');
  if (dead.length >= 3) {
    list.push({
      tone: 'crit', ico: '×',
      severityKey: 'sev_critical',
      titleKey: 'threat_dead_crit_t',
      msgHtml: `${dead.length} × DEAD: <strong>${dead.slice(0, 4).map(d => esc(d.symbol)).join(', ')}</strong>`,
      actionKey: 'action_dead_crit',
    });
    riskScore += 20;
  } else if (dead.length > 0) {
    list.push({
      tone: 'warn', ico: '×',
      severityKey: 'sev_warning',
      titleKey: 'threat_dead_warn_t',
      msgHtml: `${dead.length} × ${dead.map(d => esc(d.symbol)).join(', ')}`,
      actionKey: 'action_dead_warn',
    });
    riskScore += 8;
  }

  // 8. Weak breadth
  const weak = holdings.filter(h => h.status === 'WEAK').length;
  if (weak >= 4) {
    list.push({
      tone: 'warn', ico: '△',
      severityKey: 'sev_warning',
      titleKey: 'threat_weak_t',
      msgKey: 'threat_weak_m',
      msgPrefix: `${weak} `,
      actionKey: 'action_weak',
    });
    riskScore += 10;
  }

  // 9. Loss-heavy book
  if (stats.totalPL < 0 && stats.winners > 0 && stats.losers > stats.winners * 2) {
    list.push({
      tone: 'warn', ico: '⚠',
      severityKey: 'sev_warning',
      titleKey: 'threat_loss_t',
      msgHtml: `${stats.losers} ↓ / ${stats.winners} ↑`,
      actionKey: 'action_loss',
    });
    riskScore += 12;
  }

  // 10. Cash buffer
  if (stats.cash <= 0 && holdings.length > 0) {
    list.push({
      tone: 'info', ico: '$',
      severityKey: 'sev_info',
      titleKey: 'threat_cash_t',
      msgKey: 'threat_cash_m',
      actionKey: 'action_cash',
    });
    riskScore += 5;
  } else if (stats.portfolio > 0 && (stats.cash / stats.portfolio) > 0.5) {
    list.push({
      tone: 'info', ico: '$',
      severityKey: 'sev_info',
      titleKey: 'threat_highcash_t',
      msgKey: 'threat_highcash_m',
      msgPrefix: `${((stats.cash / stats.portfolio) * 100).toFixed(0)}% `,
      actionKey: 'action_highcash',
    });
  }

  // 11. Big winners — lock in
  const bigWinners = holdings.filter(h => h.plPct > 30 && h.risk !== 'CORE');
  if (bigWinners.length > 0) {
    list.push({
      tone: 'info', ico: '↑',
      severityKey: 'sev_opportunity',
      titleKey: 'threat_locks_t',
      msgKey: 'threat_locks_m',
      msgPrefix: `${bigWinners.map(b => esc(b.symbol)).join(', ')} `,
      actionKey: 'action_locks',
    });
  }

  // 12. Portfolio performing strongly
  if (stats.totalPL > 0 && stats.totalPLPct > 25) {
    list.push({
      tone: 'ok', ico: '✓',
      severityKey: 'sev_strong',
      titleKey: 'threat_strong_t',
      msgKey: 'threat_strong_m',
      msgPrefix: `+${stats.totalPLPct.toFixed(1)}% `,
      actionKey: 'action_strong',
    });
  }

  // 13. Multiple criticals → escalation
  const numCrit = list.filter(l => l.tone === 'crit').length;
  if (numCrit >= 2) riskScore += 15;

  riskScore = Math.min(100, Math.round(riskScore));

  // Front-load with "balanced" when score is low and nothing else fired
  if (riskScore < 20 && list.length <= 1) {
    list.unshift({
      tone: 'ok', ico: '✓',
      severityKey: 'sev_nominal',
      titleKey: 'threat_balanced_t',
      msgKey: 'threat_balanced_m',
      actionKey: 'action_balanced',
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

// Local — used only for inline HTML composition above.
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
