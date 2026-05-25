/* ============================================================
   TradeOS v4.0 — AI Journal Coach (Phase 5)
   Heuristic behavioural analysis of trading journal entries.
   No external API dependency — all patterns are rule-based.

   Patterns detected:
     1. Revenge Trading — BUY/ADD within 3 days of a same-ticker SELL
     2. Averaging Into Losers — 3+ BUY/ADD entries for same ticker
     3. FOMO Trading — 3+ entries logged on the same day
     4. Emotional Decision Making — negative emotion keywords
     5. Overtrading — >2 trades per day on average
     6. Repeated Mistakes — same lesson string appears 3+ times
   ============================================================ */

import { t, applyI18n } from '../js/i18n.js';
import * as Journal from '../js/stores/journal.js';
import { escapeHtml } from '../js/domain/format.js';
import { mountSyncButton } from '../components/sync-button.js';

let _unsub = null;
let _syncUnmount = null;

export function mount(root) {
  root.innerHTML = `
    <div class="panel">
      <div class="panel-head">
        <h3 data-i18n="ai_title">${t('ai_title')}</h3>
        <div class="hstack">
          <span class="muted" style="font-size:11px;">${t('ai_heuristic_badge')}</span>
          <span id="aiSyncBtn"></span>
        </div>
      </div>
      <div class="panel-body" id="aiBody"></div>
    </div>

    <div class="grid-2">
      <div class="panel" id="aiPatternsPanel">
        <div class="panel-head">
          <h3 data-i18n="ai_insights_title">${t('ai_insights_title')}</h3>
          <span class="muted" id="aiPatternCount">—</span>
        </div>
        <div class="panel-body" id="aiPatterns"></div>
      </div>
      <div class="panel">
        <div class="panel-head">
          <h3 data-i18n="ai_most_traded_t">${t('ai_most_traded_t')}</h3>
        </div>
        <div class="panel-body" id="aiFrequency"></div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h3 data-i18n="ai_emotion_t">${t('ai_emotion_t')}</h3>
        <span class="muted" data-i18n="ai_emotion_s">${t('ai_emotion_s')}</span>
      </div>
      <div class="panel-body" id="aiEmotions"></div>
    </div>
  `;

  applyI18n(root);
  _render(root);
  _syncUnmount = mountSyncButton(root.querySelector('#aiSyncBtn'));
  _unsub = Journal.onChange(() => _render(root));
}

export function unmount(root) {
  if (_unsub)       { _unsub(); _unsub = null; }
  if (_syncUnmount) { _syncUnmount(); _syncUnmount = null; }
  root.innerHTML = '';
}

/* ---- Render ---- */

function _render(root) {
  const entries = Journal.getAll();
  const body    = root.querySelector('#aiBody');

  if (!entries.length) {
    body.innerHTML = `
      <div class="empty">
        <div class="emo">🧠</div>
        <div class="ttl">${t('ai_no_data')}</div>
        <div class="sub">${t('ai_no_data_s')}</div>
      </div>`;
    root.querySelector('#aiPatternsPanel').style.display = 'none';
    root.querySelector('#aiFrequency').innerHTML = `<div class="empty" style="padding:20px;"><div class="emo">📊</div></div>`;
    root.querySelector('#aiEmotions').innerHTML = `<div class="empty" style="padding:20px;"><div class="emo">😐</div></div>`;
    return;
  }

  const analysis = _analyse(entries);

  // Summary
  const hasIssues = analysis.patterns.length > 0;
  body.innerHTML = `
    <div class="ai-summary ${hasIssues ? 'warn' : 'ok'}">
      <span class="ai-ico">${hasIssues ? '⚠' : '✓'}</span>
      <div>
        <div class="ai-sum-title">${hasIssues ? t('ai_issues_found', { n: analysis.patterns.length }) : t('ai_healthy_title')}</div>
        <div class="ai-sum-sub">${hasIssues ? t('ai_review_below') : t('ai_healthy_s')}</div>
      </div>
    </div>
    <div class="ai-stats">
      <div class="ai-stat"><div class="lbl">${t('perf_total_trades')}</div><div class="val">${entries.length}</div></div>
      <div class="ai-stat"><div class="lbl">${t('ai_trading_days')}</div><div class="val">${analysis.uniqueDays}</div></div>
      <div class="ai-stat"><div class="lbl">${t('ai_avg_per_day')}</div><div class="val">${analysis.avgPerDay.toFixed(1)}</div></div>
      <div class="ai-stat"><div class="lbl">${t('ai_unique_tickers')}</div><div class="val">${analysis.uniqueTickers}</div></div>
    </div>
  `;

  // Patterns
  const patsEl = root.querySelector('#aiPatterns');
  const cntEl  = root.querySelector('#aiPatternCount');
  root.querySelector('#aiPatternsPanel').style.display = '';
  cntEl.textContent = `${analysis.patterns.length} ${t(analysis.patterns.length === 1 ? 'signal' : 'signals')}`;

  if (!analysis.patterns.length) {
    patsEl.innerHTML = `<div class="empty" style="padding:20px;"><div class="emo">✓</div><div class="ttl">${t('ai_no_patterns')}</div></div>`;
  } else {
    patsEl.innerHTML = analysis.patterns.map((p, i) => `
      <div class="ai-pattern ${p.severity}" style="animation: viewIn 280ms var(--ease-out) ${i * 35}ms backwards;">
        <div class="ai-pat-head">
          <span class="ai-pat-ico">${p.ico}</span>
          <span class="ai-pat-title">${escapeHtml(t(p.titleKey))}</span>
          <span class="ai-pat-sev">${escapeHtml(t(p.sevKey))}</span>
        </div>
        <p class="ai-pat-msg">${escapeHtml(p.msg)}</p>
        ${p.advice ? `<p class="ai-pat-advice">↳ ${escapeHtml(t(p.advice))}</p>` : ''}
      </div>
    `).join('');
  }

  // Frequency
  _renderFrequency(root.querySelector('#aiFrequency'), analysis.tickerFreq);

  // Emotions
  _renderEmotions(root.querySelector('#aiEmotions'), analysis.emotions);
}

/* ---- Analysis ---- */

const EMOTION_NEG_WORDS = ['panic','fear','scared','anxious','stressed','worried','nervous','frustrated',
  'angry','desperate','emotional','chasing','revenge','impulsive','fomo','greedy','regret',
  '恐慌','恐惧','冲动','贪心','追涨','后悔'];
const EMOTION_POS_WORDS = ['calm','confident','disciplined','patient','focused','clear','rational',
  '冷静','自信','纪律','耐心'];

function _analyse(entries) {
  const byDate   = {};
  const byTicker = {};
  const lessons  = {};

  entries.forEach(e => {
    const date   = String(e.date || '').slice(0, 10);
    const ticker = e.ticker;
    const action = String(e.action || '').toUpperCase();

    if (date) {
      if (!byDate[date]) byDate[date] = [];
      byDate[date].push(e);
    }
    if (ticker) {
      if (!byTicker[ticker]) byTicker[ticker] = [];
      byTicker[ticker].push(e);
    }
    if (e.lesson) {
      const l = String(e.lesson).trim().toLowerCase();
      if (l) lessons[l] = (lessons[l] || 0) + 1;
    }
  });

  const patterns = [];
  const uniqueDays = Object.keys(byDate).length;
  const avgPerDay  = uniqueDays > 0 ? entries.length / uniqueDays : 0;

  // 1. Revenge trading
  const revengeTickers = [];
  Object.entries(byTicker).forEach(([ticker, tickerEntries]) => {
    const sells = tickerEntries
      .filter(e => e.action === 'SELL')
      .map(e => new Date(e.date).getTime())
      .filter(d => !isNaN(d));
    const buysAfterSell = tickerEntries.filter(e => {
      if (e.action !== 'BUY' && e.action !== 'ADD') return false;
      const buyT = new Date(e.date).getTime();
      return sells.some(sellT => buyT > sellT && buyT - sellT < 3 * 86400000);
    });
    if (buysAfterSell.length >= 1 && sells.length >= 1) revengeTickers.push(ticker);
  });
  if (revengeTickers.length > 0) {
    patterns.push({
      ico: '🔄', severity: 'warn', sevKey: 'sev_warning',
      titleKey: 'ai_pattern_revenge',
      msg: t('ai_revenge_msg', { tickers: revengeTickers.slice(0, 4).join(', '), n: revengeTickers.length }),
      advice: 'ai_advice_revenge',
    });
  }

  // 2. Averaging into losers (3+ buys for same ticker)
  const avgDownTickers = Object.entries(byTicker)
    .filter(([, es]) => es.filter(e => e.action === 'BUY' || e.action === 'ADD').length >= 3)
    .map(([t]) => t);
  if (avgDownTickers.length > 0) {
    patterns.push({
      ico: '📉', severity: 'warn', sevKey: 'sev_warning',
      titleKey: 'ai_pattern_avg_down',
      msg: t('ai_avgdown_msg', { tickers: avgDownTickers.slice(0, 4).join(', '), n: avgDownTickers.length }),
      advice: 'ai_advice_avg_down',
    });
  }

  // 3. FOMO (3+ entries same day)
  const fomoDates = Object.entries(byDate).filter(([, es]) => es.length >= 3).map(([d]) => d);
  if (fomoDates.length >= 2) {
    patterns.push({
      ico: '🚀', severity: 'warn', sevKey: 'sev_warning',
      titleKey: 'ai_pattern_fomo',
      msg: t('ai_fomo_msg', { n: fomoDates.length }),
      advice: 'ai_advice_fomo',
    });
  }

  // 4. Emotional decision making
  const emotionalEntries = entries.filter(e => {
    const emo = String(e.emotion || '').toLowerCase();
    return EMOTION_NEG_WORDS.some(w => emo.includes(w));
  });
  if (emotionalEntries.length >= 2) {
    patterns.push({
      ico: '😰', severity: 'warn', sevKey: 'sev_warning',
      titleKey: 'ai_pattern_emotional',
      msg: t('ai_emotional_msg', { n: emotionalEntries.length, total: entries.length }),
      advice: 'ai_advice_emotional',
    });
  }

  // 5. Overtrading (avg > 2/day and > 20 total entries)
  if (avgPerDay > 2 && entries.length > 20) {
    patterns.push({
      ico: '⚡', severity: 'crit', sevKey: 'sev_critical',
      titleKey: 'ai_pattern_overtrade',
      msg: t('ai_overtrade_msg', { avg: avgPerDay.toFixed(1), days: uniqueDays }),
      advice: 'ai_advice_overtrade',
    });
  }

  // 6. Repeated lessons
  const repeatedLessons = Object.entries(lessons).filter(([, count]) => count >= 3);
  if (repeatedLessons.length > 0) {
    patterns.push({
      ico: '🔁', severity: 'info', sevKey: 'sev_info',
      titleKey: 'ai_pattern_repeat',
      msg: t('ai_repeat_msg', { n: repeatedLessons.length }),
      advice: 'ai_advice_repeat',
    });
  }

  // Ticker frequency
  const tickerFreq = Object.entries(byTicker)
    .map(([ticker, es]) => ({ ticker, count: es.length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Emotion breakdown
  const emotions = { positive: 0, negative: 0, neutral: 0 };
  entries.forEach(e => {
    const emo = String(e.emotion || '').toLowerCase();
    if (!emo) return;
    if (EMOTION_NEG_WORDS.some(w => emo.includes(w)))  emotions.negative++;
    else if (EMOTION_POS_WORDS.some(w => emo.includes(w))) emotions.positive++;
    else emotions.neutral++;
  });

  return {
    patterns, uniqueDays, avgPerDay, tickerFreq,
    uniqueTickers: Object.keys(byTicker).length,
    emotions,
  };
}

function _renderFrequency(el, freq) {
  if (!freq.length) { el.innerHTML = `<div class="empty" style="padding:20px;"><div class="emo">📊</div></div>`; return; }
  const max = freq[0].count;
  el.innerHTML = `
    <div style="display:grid;gap:8px;">
      ${freq.map((f, i) => `
        <div class="freq-row" style="animation: viewIn 240ms var(--ease-out) ${i * 20}ms backwards;">
          <span class="sym" style="min-width:60px;"><span class="sym-ico">${escapeHtml(f.ticker.slice(0,4))}</span>${escapeHtml(f.ticker)}</span>
          <div class="freq-bar-wrap">
            <div class="freq-bar" style="width:${(f.count/max)*100}%"></div>
          </div>
          <span class="muted" style="font-size:12px;min-width:24px;text-align:right;">${f.count}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function _renderEmotions(el, { positive, negative, neutral }) {
  const total = positive + negative + neutral;
  if (!total) {
    el.innerHTML = `<div class="empty" style="padding:20px;"><div class="emo">😐</div><div class="ttl">${t('ai_no_emotion_data')}</div><div class="sub">${t('ai_no_emotion_data_s')}</div></div>`;
    return;
  }
  const pct = (n) => total > 0 ? ((n / total) * 100).toFixed(1) : '0.0';
  el.innerHTML = `
    <div class="emotion-breakdown">
      <div class="emo-bar-row">
        ${positive > 0 ? `<div class="emo-bar pos" style="flex:${positive};" title="${t('ai_emo_positive')}: ${pct(positive)}%"></div>` : ''}
        ${neutral  > 0 ? `<div class="emo-bar neutral" style="flex:${neutral};" title="${t('ai_emo_neutral')}: ${pct(neutral)}%"></div>` : ''}
        ${negative > 0 ? `<div class="emo-bar neg" style="flex:${negative};" title="${t('ai_emo_negative')}: ${pct(negative)}%"></div>` : ''}
      </div>
      <div class="emo-legend">
        <span><span class="emo-dot pos"></span>${t('ai_emo_positive')} ${pct(positive)}%</span>
        <span><span class="emo-dot neutral"></span>${t('ai_emo_neutral')} ${pct(neutral)}%</span>
        <span><span class="emo-dot neg"></span>${t('ai_emo_negative')} ${pct(negative)}%</span>
      </div>
      <div class="muted" style="font-size:11px;margin-top:10px;">${t('ai_emotion_note', { n: total, total: total })}</div>
    </div>
  `;
}
