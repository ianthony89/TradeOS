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

    // ---- Phase 2 — threats, severity, risk score, table, empties ----
    signals: 'signals', signal: 'signal',
    risk_score: 'Risk Score',
    risk_low: 'LOW', risk_moderate: 'MODERATE', risk_high: 'HIGH', risk_extreme: 'EXTREME',
    sev_critical: 'CRITICAL', sev_warning: 'WARNING', sev_info: 'INFO',
    sev_opportunity: 'OPPORTUNITY', sev_strong: 'STRONG', sev_nominal: 'NOMINAL', sev_idle: 'IDLE',
    threat_no_portfolio_t: 'No portfolio loaded',
    threat_no_portfolio_m: 'Add a holding to activate the threat engine.',
    threat_lev_crit_t: 'Leveraged Exposure Critical',
    threat_lev_warn_t: 'High Leverage',
    threat_spec_t:    'Speculation Overload',
    threat_spec_m:    'in speculative names. Reduce position counts or size.',
    threat_conc_extreme_t: 'Extreme Concentration',
    threat_conc_warn_t:    'Concentration Alert',
    threat_dead_crit_t: 'Portfolio Cleanup Required',
    threat_dead_warn_t: 'Dead Positions',
    threat_weak_t: 'Fragile Momentum',
    threat_weak_m: 'weak positions — portfolio breadth is deteriorating.',
    threat_loss_t: 'Loss-Heavy Book',
    threat_cash_t: 'No Dry Powder', threat_cash_m: 'Zero cash buffer — cannot capitalize on dips or rebalance.',
    threat_highcash_t: 'High Cash Allocation', threat_highcash_m: 'in cash — significant opportunity cost.',
    threat_locks_t: 'Lock In Gains', threat_locks_m: 'up >30%. Consider trimming to recover cost basis.',
    threat_strong_t: 'Portfolio Performing', threat_strong_m: 'overall. Stay disciplined — protect gains.',
    threat_balanced_t: 'Portfolio Balanced',
    threat_balanced_m: 'No significant risk signals detected. Maintain discipline.',
    market_value_label: 'MARKET VALUE',
    top_winners: '▲ TOP WINNERS', top_losers: '▼ TOP LOSERS',
    of_book: 'of book', across_strategies: 'Across all strategies', tracking_ops: 'Tracking opportunities',
    not_available: 'Not Available', set_in_settings: 'Set in Settings',
    stat_holdings_value: 'Holdings Value', holdings_only: 'holdings only',
    // Holdings table
    col_symbol: 'Symbol', col_qty: 'Qty', col_avg: 'Avg Cost', col_last: 'Last',
    col_mv: 'Market Value', col_pl_usd: 'P/L (USD)', col_pl_pct: 'P/L %',
    col_risk: 'Risk', col_status: 'Status', col_action: 'Action',
    filter_ticker: 'Filter ticker...',
    filter_all_risk: 'All Risk Classes', filter_all_status: 'All Status',
    clear_all: 'Clear All',
    empty_holdings_t: 'No holdings yet',
    empty_holdings_s: 'Load demo data, or add a position manually below.',
    empty_matches_t: 'No matches', empty_matches_s: 'Adjust your filters.',
    empty_heatmap_t: 'No positions to map',
    empty_heatmap_s: 'Heatmap visualizes position sizes and P/L performance.',
    // Manual add
    btn_demo: 'Load Demo Data', btn_manual: 'Add Manually', btn_add_pos: 'Add Position',
    label_symbol: 'Symbol', label_qty: 'Qty',
    label_avg_usd: 'Avg Cost (USD)', label_last_usd: 'Last Price (USD)',
    label_currency: 'Currency',
    // Toasts (holdings)
    toast_sym_req:    'Symbol and Qty required',
    toast_added:      'added', toast_updated: 'updated', toast_removed: 'removed',
    toast_cleared:    'Holdings cleared',
    toast_sample_loaded: 'Demo portfolio loaded',
    confirm_clear_holdings: 'Remove ALL holdings? This cannot be undone.',
    confirm_remove_pos: 'Remove {sym} from your portfolio?',

    // ---- Phase 3 — watchlist + journal ----
    item: 'item', items: 'items',
    entry: 'entry', entries: 'entries',
    added: 'Added',
    prio_normal: 'NORMAL', prio_high: 'HIGH PRIORITY', prio_spec: 'SPECULATIVE',
    label_catalyst: 'Catalyst', label_urgency: 'Urgency',
    reason_l: 'Reason:', emotion_l: 'Emotion:', lesson_l: 'Lesson:',
    empty_watch_t:       'Watchlist is empty',
    watchlist_empty_sub: 'Add rows to your Watchlist sheet — they will appear here on the next sync.',
    empty_journal_t:     'No journal entries',
    journal_empty_sub:   'Add rows to your Journal sheet — they will appear here on the next sync.',

    // ---- Phase 4 — live quotes + enhanced threats ----
    quotes_idle:         'Quotes idle',
    quotes_fetching:     'Fetching quotes…',
    quotes_ok:           'Live',
    quotes_error:        'Quote error',
    quotes_offline:      'Offline',
    quotes_unconfigured: 'Quotes: API not set',
    quotes_click_refresh:'Click to refresh live prices',

    // New threats
    threat_sector_warn_t:  'Sector Concentration',
    threat_sector_crit_t:  'Extreme Sector Concentration',
    threat_correlated_t:   'Correlated Top Holdings',
    threat_drawdown_t:     'Significant Drawdown',

    // Recommended actions (per threat)
    action_lev_crit:       'Cut leveraged ETF exposure to under 30% within 1–2 sessions.',
    action_lev_warn:       'Pare leveraged ETFs back below your warn threshold.',
    action_spec:           'Trim or exit your lowest-conviction speculative names.',
    action_conc_warn:      'Trim the largest holding into strength to restore diversification.',
    action_conc_extreme:   'Reduce the top position immediately — single-stock blow-up risk.',
    action_sector:         'Diversify across sectors — consider trimming the dominant sector by half.',
    action_correlated:     'Your top holdings move together. Add uncorrelated assets (defensives, cash, bonds).',
    action_drawdown:       'Review losers; tighten stops; pause new entries until the book stabilizes.',
    action_dead_warn:      'Decide each DEAD position: exit at the next bounce or commit to a clear plan.',
    action_dead_crit:      'Liquidate DEAD positions to free capital and reset the book.',
    action_weak:           'Audit weak names for thesis breaks — exit those without a catalyst.',
    action_loss:           'Stop adding to losers; focus capital on remaining winners.',
    action_cash:           'Build a cash buffer (5–15%) so dips become opportunities, not stress.',
    action_highcash:       'Stage cash into 2–3 entries on confirmed setups.',
    action_locks:          'Trim a third of each big winner back to your cost basis.',
    action_strong:         'Document what is working; do not chase — protect the gains.',
    action_balanced:       'Maintain discipline; review weekly; rotate the bottom 10% only.',
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

    // ---- Phase 2 ----
    signals: '条信号', signal: '条信号',
    risk_score: '风险评分',
    risk_low: '低', risk_moderate: '中等', risk_high: '高', risk_extreme: '极高',
    sev_critical: '严重', sev_warning: '警告', sev_info: '提示',
    sev_opportunity: '机会', sev_strong: '强势', sev_nominal: '正常', sev_idle: '空闲',
    threat_no_portfolio_t: '尚未导入持仓',
    threat_no_portfolio_m: '添加持仓以激活风险引擎。',
    threat_lev_crit_t: '杠杆敞口过高',
    threat_lev_warn_t: '杠杆偏高',
    threat_spec_t: '投机持仓过重',
    threat_spec_m: '为投机性标的。请减少仓位数量或规模。',
    threat_conc_extreme_t: '极度集中',
    threat_conc_warn_t: '集中度警告',
    threat_dead_crit_t: '组合需要清理',
    threat_dead_warn_t: '深度亏损持仓',
    threat_weak_t: '动能脆弱',
    threat_weak_m: '只持仓走弱 — 组合广度正在恶化。',
    threat_loss_t: '亏损主导',
    threat_cash_t: '无现金弹药', threat_cash_m: '现金为零 — 无法在下跌时加仓或再平衡。',
    threat_highcash_t: '现金占比过高', threat_highcash_m: '处于现金 — 机会成本显著。',
    threat_locks_t: '锁定收益', threat_locks_m: '涨幅超 30%。可考虑减仓回收成本。',
    threat_strong_t: '组合表现强势', threat_strong_m: '整体盈利。保持纪律 — 守住收益。',
    threat_balanced_t: '组合平衡',
    threat_balanced_m: '未检测到重大风险信号。继续保持纪律。',
    market_value_label: '总市值',
    top_winners: '▲ 涨幅榜', top_losers: '▼ 跌幅榜',
    of_book: '占组合', across_strategies: '覆盖所有策略', tracking_ops: '追踪机会',
    not_available: '暂无数据', set_in_settings: '可在设置中填写',
    stat_holdings_value: '持仓市值', holdings_only: '仅持仓',
    col_symbol: '代码', col_qty: '数量', col_avg: '成本价', col_last: '现价',
    col_mv: '市值', col_pl_usd: '盈亏 (USD)', col_pl_pct: '盈亏 %',
    col_risk: '风险', col_status: '状态', col_action: '建议',
    filter_ticker: '筛选代码...',
    filter_all_risk: '全部风险等级', filter_all_status: '全部状态',
    clear_all: '清空全部',
    empty_holdings_t: '暂无持仓',
    empty_holdings_s: '加载示例数据,或在下方手动添加持仓。',
    empty_matches_t: '无匹配结果', empty_matches_s: '请调整筛选条件。',
    empty_heatmap_t: '无持仓可显示',
    empty_heatmap_s: '热力图直观展示持仓规模与盈亏表现。',
    btn_demo: '加载示例数据', btn_manual: '手动添加', btn_add_pos: '添加持仓',
    label_symbol: '代码', label_qty: '数量',
    label_avg_usd: '成本价 (USD)', label_last_usd: '现价 (USD)',
    label_currency: '币种',
    toast_sym_req:    '代码与数量必填',
    toast_added:      '已添加', toast_updated: '已更新', toast_removed: '已删除',
    toast_cleared:    '持仓已清空',
    toast_sample_loaded: '示例组合已加载',
    confirm_clear_holdings: '删除所有持仓?此操作无法撤销。',
    confirm_remove_pos: '从持仓中移除 {sym}?',

    // ---- Phase 3 ----
    item: '条', items: '条',
    entry: '条记录', entries: '条记录',
    added: '添加于',
    prio_normal: '普通', prio_high: '高优先级', prio_spec: '投机性',
    label_catalyst: '催化剂', label_urgency: '紧迫度',
    reason_l: '理由:', emotion_l: '情绪:', lesson_l: '总结:',
    empty_watch_t:       '自选股为空',
    watchlist_empty_sub: '在 Watchlist 工作表中添加行,下次同步后会显示在这里。',
    empty_journal_t:     '暂无交易记录',
    journal_empty_sub:   '在 Journal 工作表中添加行,下次同步后会显示在这里。',

    // ---- Phase 4 ----
    quotes_idle:         '行情空闲',
    quotes_fetching:     '获取行情中…',
    quotes_ok:           '实时',
    quotes_error:        '行情错误',
    quotes_offline:      '离线',
    quotes_unconfigured: '行情:未配置 API',
    quotes_click_refresh:'点击刷新实时价格',

    threat_sector_warn_t:  '板块集中度',
    threat_sector_crit_t:  '板块极度集中',
    threat_correlated_t:   '前三仓位高度相关',
    threat_drawdown_t:     '显著回撤',

    action_lev_crit:       '在 1–2 个交易日内将杠杆 ETF 比重降至 30% 以下。',
    action_lev_warn:       '将杠杆 ETF 降回警告阈值以下。',
    action_spec:           '减仓或退出信念最弱的投机标的。',
    action_conc_warn:      '逢强减第一大持仓,恢复分散度。',
    action_conc_extreme:   '立即减仓第一大持仓 — 单股爆雷风险。',
    action_sector:         '跨板块分散 — 主导板块至少减半。',
    action_correlated:     '前三大持仓同步波动。加入不相关资产(防御、现金、债券)。',
    action_drawdown:       '复盘亏损;收紧止损;暂停新建仓位直到组合稳定。',
    action_dead_warn:      '为每只 DEAD 持仓做决策:反弹退出,或制定明确计划。',
    action_dead_crit:      '清算 DEAD 持仓,释放资金,重设组合。',
    action_weak:           '审计弱势持仓是否逻辑破坏;无催化剂的直接退出。',
    action_loss:           '停止补仓亏损股;资金集中在剩余赢家上。',
    action_cash:           '保留 5–15% 现金缓冲,把下跌变成机会而不是压力。',
    action_highcash:       '分 2–3 次在确认的形态上建仓。',
    action_locks:          '每只大赢家减仓三分之一以收回成本。',
    action_strong:         '记录有效做法;不要追涨 — 守住收益。',
    action_balanced:       '保持纪律;每周复盘;仅轮动垫底 10%。',
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
