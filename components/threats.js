/* ============================================================
   TradeOS v4.0 — components/threats
   Renders the threat list + risk-score gauge from domain output.
   Pure UI — takes a `{ list, riskScore }` object from
   domain/threats.detectThreats().
   ============================================================ */

import { t } from '../js/i18n.js';
import { riskScoreBucket } from '../js/domain/threats.js';
import { escapeHtml } from '../js/domain/format.js';

export function renderThreats(rootBody, countEl, { list, riskScore }, hasHoldings) {
  let gaugeHtml = '';
  if (hasHoldings) {
    const bucket = riskScoreBucket(riskScore);
    const label  = bucket === 'low' ? t('risk_low') : bucket === 'moderate' ? t('risk_moderate') : bucket === 'high' ? t('risk_high') : t('risk_extreme');
    const color  = bucket === 'low' ? 'var(--green)' : bucket === 'moderate' ? 'var(--amber)' : 'var(--red)';
    gaugeHtml = `
      <div class="risk-gauge">
        <div>
          <div class="lbl-row">${t('risk_score')}</div>
          <div class="score" style="color:${color}">${riskScore}<span class="max">/100</span></div>
        </div>
        <div style="flex:1; min-width:0;">
          <div class="lbl-row" style="margin-bottom:6px;">${label}</div>
          <div class="meter"><div class="fill" style="width:${riskScore}%"></div></div>
        </div>
      </div>`;
  }

  rootBody.innerHTML = gaugeHtml + list.map(th => {
    const sev = t(th.severityKey);
    const title = t(th.titleKey);
    const msg = _composeMsg(th);
    return `
      <div class="threat ${th.tone}">
        <span class="ico">${th.ico}</span>
        <div class="body">
          <div class="severity">${escapeHtml(sev)}</div>
          <p><strong>${escapeHtml(title)}</strong> — <span style="color:var(--text-2)">${msg}</span></p>
        </div>
      </div>`;
  }).join('');

  if (countEl) {
    const sig = list.length === 1 ? t('signal') : t('signals');
    countEl.textContent = `${list.length} ${sig}`;
  }
}

function _composeMsg(th) {
  if (th.msgHtml) {
    // msgHtml is already HTML-safe (composed by domain layer)
    return (th.msgPrefix ? escapeHtml(th.msgPrefix) : '') + th.msgHtml;
  }
  if (th.msgKey) {
    const body = t(th.msgKey, th.msgVars || {});
    return (th.msgPrefix ? escapeHtml(th.msgPrefix) : '') + escapeHtml(body);
  }
  return '';
}
