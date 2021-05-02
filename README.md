## bible-robot
本项目是 微信群读经小助手

## 支持特性
- 翻圣经: 如 「马太福音 10」「太 10」
- 翻诗歌: 如 「大本诗歌 10」「补诗歌 25」「新诗歌 1」「儿诗歌 1」「青诗歌 1」
- 翻书报: 如「晨兴」「晨兴纲目」「书报」
- 群读经提醒: 如「创建读经计划」「今日读经」「明日读经」「读经统计」「本周读经统计」
- 晨兴提醒: 如 「开启晨兴推送 7」、「关闭晨兴推送」
- 设置晨兴进度: 如 「设置晨兴进度 2020-6-4」即本周进入 2020 年第 6 次特会的第 4 篇信息

## 功能演示
### 翻圣经、翻诗歌
![image](https://raw.githubusercontent.com/kkdev163/bible-robot/master/public/images/%E5%8A%9F%E8%83%BD%E4%BB%8B%E7%BB%8D.jpg)
### 晨兴推送
![image](https://raw.githubusercontent.com/kkdev163/bible-robot/master/public/images/%E6%99%A8%E5%85%B4.jpg)
### 群读经提醒、统计
![image](https://raw.githubusercontent.com/kkdev163/bible-robot/master/public/images/%E8%AF%BB%E7%BB%8F%E7%BB%9F%E8%AE%A1.jpg)

使用提示: 在群聊中发送指令时，需要添加 @读经助手 前缀。(已读 除外)

## 技术栈
- [wechaty](https://wechaty.js.org/) 微信机器人 SDK
- mongoDB 数据库存储

## 部署依赖
- [wechaty](https://wechaty.js.org/docs/puppet-services/paimon/), 可在购买页获取 7 天的试用 token。获取 TOKEN 后修改 .env 文件内的 WECHATY_PUPPET_SERVICE_TOKEN 即可

## 部署
```
npm install
npm start
```

## 免责声明
该项目仅用于 个人研究 和 学习，请勿使用该项目进行商业盈利。
