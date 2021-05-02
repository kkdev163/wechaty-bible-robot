export const ShareImg = 'https://ae01.alicdn.com/kf/U05b7046a9a94461295cf53169457ed6ax.jpg';

export const Action_Receiver = '读经助手';
export const ScheduleCompeleteTag = /已读|己读|完成|读完|已听|听完|^\d+$/;
export const ScheduleCatchupTag = /已补|补读|昨\s*(日|天)\s*(已读|己读|完成|读完|已听)|补\s*昨\s*(日|天)/

export enum Actions {
  SearchBible = '查经',
  SearchSmdj = '查生命读经',
  ReadBible = '读经',
  CreatePlan = '创建读经计划',
  CancelPlan = '关闭读经计划',
  ConfigPlan = '设置读经推送',
  DisplayPlan = '读经计划表',
  GetPlan = '今日读经',
  GetTomorrowPlan = '明日读经',
  Static = '读经统计',
  StatsWeek = '本周读经统计',
  SongLink = '诗歌',
  HomeLink = '书报',
  _7CTH = '晨兴',
  _7CTH_SUMMARY = '晨兴纲目',
  _7CTH_CONFIG = '设置晨兴进度',
  _7CTH_PUSH = '开启晨兴推送',
  _7CTH_PUSH_CLOSE = '关闭晨兴推送',
  _7CTH_Stats = '晨兴统计',
  _7CTH_StatsWeek = '本周晨兴统计',
  LeeArticle = '文集',
  LeeArticle_PUSH = '设置文集推送',
  LeeArticleStats = '文集统计',
  LeeArticleStatsWeek = '本周文集统计',
  Smdj = '生命读经',
  SmdjToday = '今日生命读经',
  CreateSmdjPlan = '创建生命读经计划',
  CancelSmdjPlan = '关闭生命读经计划',
  ConfigSmdjPlan = '设置生命读经推送',
  DisplaySmdjPlan = '生命读经计划表',
  SmdjUnCommitRemind= '生命读经未读提醒',
  SmdjStats = '生命读经统计',
  SmdjStatsWeek = '本周生命读经统计',
  Introduce = '介绍',
  FeedBack = '反馈',
  ForceExit = '强制下线!911',
  Help = '更多功能',
  ConfigPage = '设置页面',
  addWhiteList = '增加提醒白名单',
  ManuallyCommit = '打卡',
}

const mapToAction = arr => arr.map(v => `「${v}」`).join('')

export const ActionHelper = [
  '搜圣经: 如 「查经 神就是爱」 ',
  '读圣经: 如 「读经 提后三16、17，彼前二1~3」',
  '翻圣经: 如 「马太福音 10」「太 10」',
  '翻诗歌: 如 「大本 10」「补充本 25」',
  '翻书报: 如' + mapToAction([Actions._7CTH, Actions.LeeArticle, Actions.HomeLink]),
  `输入「${Actions.Help}」查看详情`
]

export const ManuallyCommitFORMAT = `请使用如下格式「@${Action_Receiver} ${Actions.ManuallyCommit} 日期: 0301 0302 」`

export const ActionHelperDetail = [
  '翻圣经: 如 「马太福音 10」「太 10」',
  '翻诗歌: 如 「大本 10」「补充本 25」「新歌 1」「儿童 1」「青年诗歌 1」',
  '翻书报: 如' + mapToAction([Actions._7CTH, Actions._7CTH_SUMMARY, Actions.HomeLink]),
  '读圣经: 如 「读经 提后三16、17，彼前二1~3」 格式要求: 缩写书名 + 大写章数 + 小节范围。不同章使用「，」分隔；小节范围使用「、~ -」指定。',
  '搜圣经: 如 「查经 神就是爱」 默认展示5条，如需更多请指定条数 「查经 神就是爱 10条」',
  '群读经推送: 如' + mapToAction([Actions.CreatePlan, Actions.ConfigPlan, Actions.DisplayPlan, Actions.GetPlan, Actions.StatsWeek, Actions.CancelPlan,]),
  `翻生命读经: 如 「${Actions.Smdj} 约伯记 33」;也可分上下两篇进入，如「${Actions.Smdj} 33 上」`,
  `搜生命读经: 如「${Actions.SearchSmdj} 那灵 」默认展示5条，如需更多请指定条数「${Actions.SearchSmdj} 那灵 10条」`,
  '生命读经推送: 如' + mapToAction([Actions.CreateSmdjPlan, Actions.ConfigSmdjPlan, Actions.DisplaySmdjPlan, Actions.CancelSmdjPlan]),
  `文集推送: 如 「${Actions.LeeArticle_PUSH} 7」 7点推送、 「${Actions.LeeArticle_PUSH} -1」关闭推送`,
  '生命读经推送: 如' + mapToAction([Actions.CreateSmdjPlan, Actions.ConfigSmdjPlan, Actions.CancelSmdjPlan, Actions.DisplaySmdjPlan, Actions.SmdjStatsWeek]),
  `晨兴提醒: 如 「${Actions._7CTH_PUSH} 7」、「${Actions._7CTH_PUSH_CLOSE}」`,
  `设置晨兴进度: 如 「${Actions._7CTH_CONFIG} 2020-6-4」即本周进入 2020 年第 6 次特会的第 4 篇信息`,
  `打卡: ${ManuallyCommitFORMAT}`,
  '反馈建议: 如 「反馈 希望增加某项功能」'
]

export const FixNumPlanReg = /创建读经计划\s+([^\d\s]+)\s*(\d+)\s+(\d+)\s*章?\s*(\d*)/
export const FixTimePlanReg = /创建读经计划\s+([^\d\s]+)\s*(\d+)\s*[~-]\s*([^\d\s]+)\s*(\d+)\s*(\d+)天?\s*(\d*)/;
// 创建生命读经计划 约伯记1-箴言书9  每日不超过10分钟
export const SmdjPlanReg = /创建生命读经计划\s+([^\d\s]+)\s*(\d+)\s*[~-]\s*([^\d\s]+)\s*(\d+)\s*(?:每日篇幅小于\s*(\d+)\s*分钟)?\s*(\d*)/
export const SmdjPlanAndReg = /创建生命读经计划\s+([^\s]+)\s*(?:每日篇幅小于\s*(\d+)\s*分钟)?\s*(\d*)/
export const FIX_NUM_PLAN_FORMAT = `起始书名 起始章数 每天章数, 如「${Actions.CreatePlan} 加拉太书1 3章」`;
export const FIX_TIME_PLAN_FORMAT = `起始书名 起始章数-结束书名 结束章数 多少天完成, 如「${Actions.CreatePlan} 创世记1~玛拉基书4 90天」`;
export const SMDJ_PLAN_FORMAT = `起始书名 起始篇数-结束书名 结束篇数，每日不超过多少分钟，如「${Actions.CreateSmdjPlan}」约伯记+箴言书  每日篇幅小于10分钟`
export const MISS_PLAN_HINT = '当前群聊未创建读经计划, 请先使用 「' + Actions.CreatePlan + '」指令，该指令格式为: ' + FIX_NUM_PLAN_FORMAT
export const MISS_CX_PUSH_HINT = '当前群聊未' + Actions._7CTH_PUSH + ', 请先使用 「' + Actions._7CTH_PUSH + '」指令'
export const MISS_LeeArticle_PUSH_HINT = '当前群聊未' + Actions.LeeArticle_PUSH + ', 请先使用 「' + Actions.LeeArticle_PUSH + '」指令'
export const MISS_Smdj_PUSH_HINT = '当前群聊未' + Actions.CreateSmdjPlan + ', 请先使用 「' + Actions.CreateSmdjPlan + '」指令'
export const ReadBibleFORMAT = `@${Action_Receiver} ${Actions.ReadBible} 伯一6~12，二1，启十二5、7~11`



// 已读打卡书卷章节正则
export const ReadBibleReg = /([^\d-\s]+)[\s]*(\d+)[^\d]+(\d+)/;

// 圣经书卷
export const BOOK_CATALOG: [string, string, number][] = [
  ['创世记', '创', 50],
  ['出埃及记', '出', 40],
  ['利未记', '利', 27],
  ['民数记', '民', 36],
  ['申命记', '申', 34],
  ['约书亚记', '书', 24],
  ['士师记', '士', 21],
  ['路得记', '得', 4],
  ['撒母耳记上', '撒上', 31],
  ['撒母耳记下', '撒下', 24],
  ['列王记上', '王上', 22],
  ['列王记下', '王下', 25],
  ['历代志上', '代上', 29],
  ['历代志下', '代下', 36],
  ['以斯拉记', '拉', 10],
  ['尼希米记', '尼', 13],
  ['以斯贴记', '斯', 10],
  ['约伯记', '伯', 42],
  ['诗篇', '诗', 150],
  ['箴言', '箴', 31],
  ['传道书', '传', 12],
  ['雅歌', '歌', 8],
  ['以赛亚书', '赛', 66],
  ['耶利米书', '耶', 52],
  ['耶利米哀歌', '哀', 5],
  ['以西结书', '结', 48],
  ['但以理书', '但', 12],
  ['何西阿书', '何', 14],
  ['约珥书', '珥', 3],
  ['阿摩司书', '摩', 9],
  ['俄巴底亚书', '俄', 1],
  ['约拿书', '拿', 4],
  ['弥迦书', '弥', 7],
  ['那鸿书', '鸿', 3],
  ['哈巴谷书', '哈', 3],
  ['西番雅书', '番', 3],
  ['哈该书', '该', 2],
  ['撒迦利亚书', '亚', 14],
  ['玛拉基书', '玛', 4],
  ['马太福音', '太', 28],
  ['马可福音', '可', 16],
  ['路加福音', '路', 24],
  ['约翰福音', '约', 21],
  ['使徒行传', '徒', 28],
  ['罗马书', '罗', 16],
  ['哥林多前书', '林前', 16],
  ['哥林多后书', '林后', 13],
  ['加拉太书', '加', 6],
  ['以弗所书', '弗', 6],
  ['腓立比书', '腓', 4],
  ['歌罗西书', '西', 4],
  ['帖撒罗尼迦前书', '帖前', 5],
  ['帖撒罗尼迦后书', '帖后', 3],
  ['提摩太前书', '提前', 6],
  ['提摩太后书', '提后', 4],
  ['提多书', '多', 3],
  ['腓利门书', '门', 1],
  ['希伯来书', '来', 13],
  ['雅各书', '雅', 5],
  ['彼得前书', '彼前', 5],
  ['彼得后书', '彼后', 3],
  ['约翰一书', '约壹', 5],
  ['约翰二书', '约贰', 1],
  ['约翰三书', '约叁', 1],
  ['犹大书', '犹', 1],
  ['启示录', '启', 22],
];

// 生命读经书卷
export const SMDJ_CATALOG: [string, number][] = [
  ["创世记", 120],
  ["出埃及记", 185],
  ["利未记", 64],
  ["民数记", 53],
  ["申命记", 30],
  ["约书亚记", 15],
  ["士师记", 10],
  ["路得记", 8],
  ["撒母耳记", 38],
  ["列王纪", 23],
  ["历代志", 13],
  ["以斯拉", 5],
  ["尼希米记", 5],
  ["以斯帖记", 3],
  ["约伯记", 38],
  ["诗篇", 45],
  ["箴言", 8],
  ["传道书", 2],
  ["雅歌", 10],
  ["以赛亚书", 54],
  ["耶利米书", 40],
  ["耶利米哀歌", 4],
  ["以西结书", 27],
  ["但以理书", 17],
  ["何西阿书", 9],
  ["约珥书", 7],
  ["阿摩司书", 3],
  ["俄巴底亚书", 1],
  ["约拿书", 1],
  ["弥迦书", 4],
  ["那鸿书", 1],
  ["哈巴谷书", 3],
  ["西番雅书", 1],
  ["哈该书", 1],
  ["撒迦利亚书", 15],
  ["玛拉基书", 4],
  ["马太福音", 72],
  ["马可福音", 70],
  ["路加福音", 79],
  ["约翰福音", 51],
  ["使徒行传", 72],
  ["罗马书", 69],
  ["哥林多前书", 69],
  ["哥林多后书", 59],
  ["加拉太书", 46],
  ["以弗所书", 97],
  ["腓立比书", 62],
  ["歌罗西书", 65],
  ["帖撒罗尼迦前书", 24],
  ["帖撒罗尼迦后书", 7],
  ["提摩太前书", 12],
  ["提摩太后书", 8],
  ["提多书", 6],
  ["腓利门书", 2],
  ["希伯来书", 69],
  ["雅各书", 14],
  ["彼得前书", 34],
  ["彼得后书", 13],
  ["约翰一书", 40],
  ["约翰二书", 2],
  ["约翰三书", 2],
  ["犹大书", 5],
  ["启示录", 68]
]

export const _7cthFormat = `请使用如下格式: 「${Actions._7CTH_CONFIG} YYYY-X-Z」 如: 「${Actions._7CTH_CONFIG} 2020-6-4」，即本周进入 2020 年第 6 次特会 第 4 篇信息`;
export const _7cthReg = /(\d{4})-(\d)-(\d)/;
export const _7cthLinkPrefix = 'https://bibletruth01.oss-cn-hangzhou.aliyuncs.com/7cth/';
export const _7cthTotalChapter = {
  '2020-6': 6,
  '2020-7': 12
}
// 7 次特会进度默认配置，每个 群/个人 可以单独设置进度
export const _7cthDefaultPlan = {
  startDay: 20210301,
  startBookChapter: '2020-6-4',
}

export const _7cthDefaultRemindHour = 7;