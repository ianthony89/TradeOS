/* ============================================================
   TradeOS v4.0 — i18n
   Full bilingual dictionary (en / zh).
   Most keys are PORTED VERBATIM from v3.7 so feature modules
   can be enabled without retranslating. v4 additions are grouped
   under "// v4 Phase 1 additions" comments.
   ============================================================ */

export const DEFAULT_LANG = 'en';

export const I18N = {
  en: {
    // ---- v4 Phase 1 additions ----
    app_title: 'TradeOS',
    app_subtitle: 'Trading Operating System',
    brand_sub: 'OS · v4',

    lock_title_create: 'Create Your PIN',
    lock_title_enter:  'Enter PIN',
    lock_title_confirm:'Confirm PIN',
    lock_sub_create:   'Set a 4–8 digit PIN to protect your data on this device.',
    lock_sub_enter:    'TradeOS is locked. Enter your PIN to continue.',
    lock_sub_confirm:  'Enter the same PIN once more.',
    lock_msg_mismatch: 'PINs did not match. Try again.',
    lock_msg_wrong:    'Incorrect PIN.',
    lock_msg_min:      'PIN must be at least 4 digits.',
    lock_msg_max:      'PIN must be at most 8 digits.',
    lock_key_clear:    'CLEAR',
    lock_key_back:     '⌫',
    lock_key_forget:   'Forget PIN',
    lock_forget_confirm: 'Forgetting the PIN will WIPE all local data on this device. Continue?',
    lock_brand:        'TradeOS · v4',
    lock_locked_now:   'Locked',

    sync_label:        'Sync',
    sync_idle:         'Idle',
    sync_syncing:      'Syncing…',
    sync_ok:           'Synced',
    sync_error:        'Sync error',
    sync_offline:      'Offline',
    sync_unconfigured: 'API not configured',
    sync_just_now:     'just now',
    sync_seconds_ago:  '{n}s ago',
    sync_minutes_ago:  '{n}m ago',
    sync_now_btn:      'Sync now',

    api_endpoint_label: 'Google Apps Script Endpoint URL',
    api_endpoint_ph:    'https://script.google.com/macros/s/.../exec',
    api_key_label:      'API Key (optional)',
    api_key_ph:         'Shared secret your script checks',
    api_test_btn:       'Test Connection',
    api_test_ok:        'Connection OK · {ms} ms',
    api_test_fail:      'Connection failed: {msg}',
    api_save_btn:       'Save API Settings',
    api_saved:          'API settings saved',
    api_clear_btn:      'Clear API Settings',
    api_cleared:        'API settings cleared',

    settings_security:  'Security',
    settings_api:       'API & Sync',
    settings_about:     'About',
    pin_change_btn:     'Change PIN',
    pin_lock_now_btn:   'Lock Now',
    pin_lock_idle_label:'Auto-lock when tab is hidden',
    sync_interval_label:'Auto-sync interval (seconds)',

    nav_section_workspace:'Workspace',
    nav_section_tools:    'Tools',

    coming_soon_t: 'Coming in Phase 2',
    coming_soon_s: 'This module is scaffolded. Implementation lands in the next phase.',

    // ---- Ported verbatim from v3.7 ----
    nav_workspace: 'Workspace', nav_strategy_sec: 'Strategy', nav_tools: 'Tools',
    nav_dashboard: 'Dashboard', nav_holdings: 'Holdings', nav_watchlist: 'Watchlist',
    nav_journal: 'Journal', nav_command: 'Command', nav_heatmap: 'Heatmap',
    nav_import: 'Import', nav_settings: 'Settings',
    nav_intelligence: 'Intelligence',
    nav_ailab: 'AI Lab', nav_askalpha: 'Ask Alpha', nav_compare: 'Compare',
    nav_opportunity: 'Opportunity', nav_brief: 'Brief', nav_dividends: 'Dividends',
    nav_mistakes: 'Coach', nav_simulator: 'Simulator', nav_vault: 'Thesis Vault',
    nav_profiles: 'Profiles', nav_ai: 'AI',
    market_sim: 'Market Sim',
    search_placeholder: 'Search tickers, journal, notes...',
    import_btn: 'Import',
    posture_aggressive: 'Aggressive', posture_neutral: 'Neutral', posture_defensive: 'Defensive',
    good_morning: 'Good morning', good_afternoon: 'Good afternoon',
    good_evening: 'Good evening', good_night: 'Good night', good_latenight: 'Good late night',
    subtitle: 'Tactical overview',
    stat_portfolio: 'Portfolio Value', stat_pl: 'Unrealized P/L', stat_risk: 'Risk Exposure',
    stat_cash: 'Cash Balance', stat_winners: 'Winners', stat_losers: 'Losers',
    stat_positions: 'Open Positions', stat_watchlist: 'Watchlist',
    of_book: 'of book', across_strategies: 'Across all strategies', tracking_ops: 'Tracking opportunities',
    threats_title: 'Advanced Threat Engine',
    chart_alloc: 'Allocation Breakdown', chart_alloc_sub: 'By market value',
    chart_risk: 'Risk Exposure', chart_risk_sub: 'By risk class',
    chart_heatmap: 'Position Heatmap', chart_heatmap_sub: 'Size = MV · Color = P/L%',
    chart_movers: 'Top Movers', chart_movers_sub: 'Best / Worst',
    chart_pl: 'P/L by Position', chart_pl_sub: 'Unrealized USD',
    holdings_title: 'Holdings',
    watchlist_title: 'Watchlist',
    journal_title: 'Trading Journal',
    strategy_title: 'Strategy Command Center',
    settings_account: 'Account & Display',
    label_name: 'Display Name', label_fx: 'USD / MYR FX Rate', label_cash_usd: 'Cash Balance (USD)',
    label_theme: 'Theme', label_lang: 'Language',
    theme_dark: 'Dark', theme_light: 'Light',
    btn_save_settings: 'Save Settings',
    btn_export: 'Export All (JSON)', btn_import_snap: 'Import Snapshot', btn_reset: 'Reset Everything',
    // Toasts
    toast_settings_saved: 'Settings saved',
    toast_dark_on: 'Dark mode enabled', toast_light_on: 'Light mode enabled',
    toast_lang_en: 'Language: English', toast_lang_zh: 'Language: 中文',
    // Market bar
    mkt_my_time: 'MY Time', mkt_us_time: 'NASDAQ',
    us_sess_pre: 'Pre-Market', us_sess_open: 'OPEN', us_sess_after: 'After Hours',
    us_sess_closed: 'Closed', us_sess_weekend: 'Weekend Closed',
    my_sess_pre: 'Pre-Open', my_sess_morning: 'Morning Session', my_sess_lunch: 'Lunch Break',
    my_sess_afternoon: 'Afternoon Session', my_sess_closed: 'Closed', my_sess_weekend: 'Weekend Closed',
    mf_all: 'ALL', mf_my: 'MY', mf_us: 'US',
  },

  zh: {
    // ---- v4 Phase 1 additions ----
    app_title: 'TradeOS',
    app_subtitle: '交易操作系统',
    brand_sub: '操作系统 · v4',

    lock_title_create: '创建 PIN 码',
    lock_title_enter:  '请输入 PIN',
    lock_title_confirm:'确认 PIN 码',
    lock_sub_create:   '设置 4–8 位 PIN 码以保护本机数据。',
    lock_sub_enter:    'TradeOS 已锁定,请输入 PIN 码继续。',
    lock_sub_confirm:  '请再次输入相同的 PIN 码。',
    lock_msg_mismatch: 'PIN 不一致,请重试。',
    lock_msg_wrong:    'PIN 错误。',
    lock_msg_min:      'PIN 至少 4 位。',
    lock_msg_max:      'PIN 最多 8 位。',
    lock_key_clear:    '清除',
    lock_key_back:     '⌫',
    lock_key_forget:   '忘记 PIN',
    lock_forget_confirm: '忘记 PIN 将清除本机所有本地数据,继续吗?',
    lock_brand:        'TradeOS · v4',
    lock_locked_now:   '已锁定',

    sync_label:        '同步',
    sync_idle:         '空闲',
    sync_syncing:      '同步中…',
    sync_ok:           '已同步',
    sync_error:        '同步错误',
    sync_offline:      '离线',
    sync_unconfigured: '未配置 API',
    sync_just_now:     '刚刚',
    sync_seconds_ago:  '{n} 秒前',
    sync_minutes_ago:  '{n} 分钟前',
    sync_now_btn:      '立即同步',

    api_endpoint_label: 'Google Apps Script 接口地址',
    api_endpoint_ph:    'https://script.google.com/macros/s/.../exec',
    api_key_label:      'API 密钥(可选)',
    api_key_ph:         '脚本端校验的共享密钥',
    api_test_btn:       '测试连接',
    api_test_ok:        '连接成功 · {ms} ms',
    api_test_fail:      '连接失败:{msg}',
    api_save_btn:       '保存 API 设置',
    api_saved:          'API 设置已保存',
    api_clear_btn:      '清除 API 设置',
    api_cleared:        'API 设置已清除',

    settings_security:  '安全',
    settings_api:       'API 与同步',
    settings_about:     '关于',
    pin_change_btn:     '修改 PIN',
    pin_lock_now_btn:   '立即锁定',
    pin_lock_idle_label:'切换标签页时自动锁定',
    sync_interval_label:'自动同步间隔(秒)',

    nav_section_workspace:'工作区',
    nav_section_tools:    '工具',

    coming_soon_t: '即将在第二阶段推出',
    coming_soon_s: '该模块已搭好骨架,具体功能将在下一阶段实现。',

    // ---- Ported verbatim from v3.7 ----
    nav_workspace: '工作区', nav_strategy_sec: '策略', nav_tools: '工具',
    nav_dashboard: '总览', nav_holdings: '持仓', nav_watchlist: '自选股',
    nav_journal: '交易日志', nav_command: '策略中心', nav_heatmap: '热力图',
    nav_import: '导入', nav_settings: '设置',
    nav_intelligence: '智能',
    nav_ailab: 'AI 研究室', nav_askalpha: '问 Alpha', nav_compare: '对比',
    nav_opportunity: '机会雷达', nav_brief: '盘前简报', nav_dividends: '股息',
    nav_mistakes: '行为教练', nav_simulator: '风险模拟', nav_vault: '逻辑保险库',
    nav_profiles: '用户档案', nav_ai: 'AI',
    market_sim: '模拟行情',
    search_placeholder: '搜索代码、日志、笔记...',
    import_btn: '导入',
    posture_aggressive: '激进', posture_neutral: '中性', posture_defensive: '防守',
    good_morning: '早上好', good_afternoon: '下午好',
    good_evening: '晚上好', good_night: '夜深了', good_latenight: '凌晨好',
    subtitle: '战术总览',
    stat_portfolio: '总资产', stat_pl: '未实现盈亏', stat_risk: '风险敞口',
    stat_cash: '现金余额', stat_winners: '盈利持仓', stat_losers: '亏损持仓',
    stat_positions: '持仓数量', stat_watchlist: '自选股',
    of_book: '占组合', across_strategies: '覆盖所有策略', tracking_ops: '追踪机会',
    threats_title: '高级风险预警引擎',
    chart_alloc: '配置分布', chart_alloc_sub: '按市值',
    chart_risk: '风险敞口', chart_risk_sub: '按风险等级',
    chart_heatmap: '持仓热力图', chart_heatmap_sub: '大小=市值 · 颜色=盈亏%',
    chart_movers: '涨跌榜', chart_movers_sub: '最佳 / 最差',
    chart_pl: '逐仓盈亏', chart_pl_sub: '未实现盈亏 (USD)',
    holdings_title: '持仓明细',
    watchlist_title: '自选股',
    journal_title: '交易日志',
    strategy_title: '策略指挥中心',
    settings_account: '账户与显示',
    label_name: '显示名称', label_fx: 'USD / MYR 汇率', label_cash_usd: '现金余额 (USD)',
    label_theme: '主题', label_lang: '语言',
    theme_dark: '深色', theme_light: '浅色',
    btn_save_settings: '保存设置',
    btn_export: '导出全部 (JSON)', btn_import_snap: '导入快照', btn_reset: '重置全部',
    toast_settings_saved: '设置已保存',
    toast_dark_on: '已开启深色模式', toast_light_on: '已开启浅色模式',
    toast_lang_en: 'Language: English', toast_lang_zh: '语言: 中文',
    mkt_my_time: '马来时间', mkt_us_time: '纳斯达克',
    us_sess_pre: '盘前', us_sess_open: '开盘中', us_sess_after: '盘后',
    us_sess_closed: '休市', us_sess_weekend: '周末休市',
    my_sess_pre: '开盘前', my_sess_morning: '早市', my_sess_lunch: '午休',
    my_sess_afternoon: '午市', my_sess_closed: '休市', my_sess_weekend: '周末休市',
    mf_all: '全部', mf_my: '马股', mf_us: '美股',
  },
};

let _lang = DEFAULT_LANG;

export function setLang(lang) {
  if (!I18N[lang]) lang = DEFAULT_LANG;
  _lang = lang;
  document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');
}

export function getLang() { return _lang; }

export function t(key, vars) {
  let s = (I18N[_lang] && I18N[_lang][key]) || (I18N.en && I18N.en[key]) || key;
  if (vars) {
    for (const k in vars) s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), vars[k]);
  }
  return s;
}

/**
 * Re-apply translations to every element in `root` (default: document).
 * Reads data-i18n / data-i18n-placeholder / data-i18n-title attributes.
 */
export function applyI18n(root) {
  root = root || document;
  root.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
  });
  root.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
  });
}

/* ============================================================
   MARKET SESSION / TIMEZONE helpers
   Ported from v3.7 — DST-safe via Intl.
   ============================================================ */

function _tzParts(tz, date) {
  try {
    const f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', weekday: 'short',
    });
    const parts = {};
    f.formatToParts(date).forEach(p => { parts[p.type] = p.value; });
    return {
      hh: parseInt(parts.hour, 10),
      mm: parseInt(parts.minute, 10),
      day: parts.weekday,
    };
  } catch (e) { return { hh: 0, mm: 0, day: 'Mon' }; }
}

export function fmtClock(tz, opts) {
  opts = opts || {};
  try {
    return new Intl.DateTimeFormat(opts.locale || 'en-US', {
      timeZone: tz,
      hour: '2-digit', minute: '2-digit',
      hour12: !!opts.hour12,
    }).format(new Date());
  } catch (e) { return '--:--'; }
}

export function usSessionState() {
  const p = _tzParts('America/New_York', new Date());
  if (p.day === 'Sat' || p.day === 'Sun') return { code: 'weekend', key: 'us_sess_weekend' };
  const mins = p.hh * 60 + p.mm;
  if (mins >= 4*60 && mins < 9*60+30)  return { code: 'pre',   key: 'us_sess_pre' };
  if (mins >= 9*60+30 && mins < 16*60) return { code: 'open',  key: 'us_sess_open' };
  if (mins >= 16*60 && mins < 20*60)   return { code: 'after', key: 'us_sess_after' };
  return { code: 'closed', key: 'us_sess_closed' };
}

export function mySessionState() {
  const p = _tzParts('Asia/Kuala_Lumpur', new Date());
  if (p.day === 'Sat' || p.day === 'Sun') return { code: 'weekend', key: 'my_sess_weekend' };
  const mins = p.hh * 60 + p.mm;
  if (mins >= 8*60+30  && mins < 9*60)     return { code: 'pre',  key: 'my_sess_pre' };
  if (mins >= 9*60     && mins < 12*60+30) return { code: 'open', key: 'my_sess_morning' };
  if (mins >= 12*60+30 && mins < 14*60+30) return { code: 'pre',  key: 'my_sess_lunch' };
  if (mins >= 14*60+30 && mins < 17*60)    return { code: 'open', key: 'my_sess_afternoon' };
  return { code: 'closed', key: 'my_sess_closed' };
}

export function greetingKey() {
  const h = new Date().getHours();
  return h < 5 ? 'good_latenight' : h < 12 ? 'good_morning' : h < 17 ? 'good_afternoon' : h < 21 ? 'good_evening' : 'good_night';
}
