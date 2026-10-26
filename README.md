# 今日AI速报

每天两期的 AI 热点速报网站：夜间版（昨晚 18:00 → 今早）和白天版（今早 09:00 → 傍晚）。用大白话讲清楚发生了什么，并精选一批 AI 博主的干货帖。

**在线地址：** [https://ai-today.sunth.cn](https://ai-today.sunth.cn)

（旧地址 `sunthx.github.io/ai-today` 会跳转到上面。）

## 看什么

- **速报首页**：默认打开就是最新一期。热度前三放在「🏆 本期擂台」里，🥇金牌 / 🥈银牌 / 🥉铜牌重点展示；后面是其余热点。
- **KOL 页**：同一套浏览方式。每位博主每期最多精选 2 条——只留当天 AI 趋势、新玩法或新研究，闲聊和广告不收。点头像可离线翻看该博主的精选。
- **浏览**：单列 / 双列 / 三列切换；右侧时间轴翻往期；图片有加载动画，内容分批加载。
- **主题**：按北京时间自动切换——06:00–18:00 亮色，其余暗色。
- **查看原帖**：速报和 KOL 页都先在站内弹窗里看离线存档（X 风格排版）；想去原帖，点弹窗右上角「跳转 X」。
- **站内看图**：点图片在站内灯箱里看原图，多图可左右切换（← → / 滑动），双击或滚轮缩放、拖动查看，Esc 或点空白处关闭；不开新标签页。
- **在线访客**：右上角像飞书文档一样显示正在看的人（随机可爱头像 + 昵称，如「偶遇的水母」）。头像在本地按随机 id 生成，不收集任何个人信息；实时同步走公共 MQTT broker（`presence.js` + `vendor-mqtt.min.js`，页面加载完才懒加载），连不上或本地 `file://` 打开时自动隐藏。
- **Grok Bot 表情图标**：`faces/` 里 14 个原创机器人小脸（`tools/make_faces.py` 生成），每次打开页面随机换一个（不和上次重复），网页图标和顶栏小脸是同一个；不支持 SVG 图标的浏览器 / iOS 用默认「开心」脸的 favicon.ico / PNG。

## 更新节奏

每天北京时间 **09:00**（夜间版）和 **18:00**（白天版）自动更新并发布到本仓库。

## 技术说明

纯静态站（HTML / CSS / JS），没有后端。数据按期拆分加载，卡片用压缩缩略图，首屏只拉最新一期。本仓库由 GitHub Pages 托管，自定义域名为 `ai-today.sunth.cn`。

本地也可以直接双击 `index.html` 打开（离线图片在 `media/` 里）。

## 目录结构（简）

| 路径 | 说明 |
| --- | --- |
| `index.html` / `kol.html` | 速报页 / KOL 页 |
| `app-*.js` `common.js` `theme.js` `style.css` | 前端逻辑与样式 |
| `data/digest-index.js` `data/kol-index.js` | 期目录 + 最新一期数据 |
| `data/d/` `data/k/` | 各期速报 / KOL 精选（切到哪期再加载） |
| `media/` `media/t/` | 原图与 webp 缩略图 |

---

维护者：[sunthx](https://github.com/sunthx) · 自动发布

## 文件约定（给定时任务用）

每次推送跑完，在本期运行文件夹（如 `/workspace/day1023/`、`/workspace/ov1023/`）里放：

1. `items.json`：`{title, sub, extra?, items:[{e, h, t, u, d?, img?, pid?, rank?}]}`。`title` 要含「夜间」或「白天」和 `· MM/DD`；`sub` 写「北京时间 MM/DD HH:MM – MM/DD HH:MM」。`d` = 3–6 句大白话详细解读（只依据原帖），`pid` = 原帖 ID，`img` 可不填（脚本自动取图）。可选数字 `rank`：网站擂台按它排序（1/2/3 = 金/银/铜）；不写则按数组顺序。
2. `src_posts.json`：`get_posts_by_ids` 查本期原帖的原始返回（含 media / author 等 expansions）。
3. `kol_posts/<账号>.json`：每个关注账号一份 `get_users_posts`（`exclude=replies,retweets`）的原始返回；可选 `kol_posts/_users.json`。
4. `kol_picks.json`：`{"picks":[{"pid":"…","why":"≤20字"}]}`。只挑当天 AI 趋势、新玩法或新研究；每位博主每期最多 2 条。没有这个文件时，脚本按 AI 相关度 → 互动量自动挑。
5. 然后运行：

```bash
cd /workspace/ai-digest-site && python3 build_data.py
bash /workspace/ai-digest-site/publish.sh
```

不联网下载图片时加 `--no-download`。截图自检：`/workspace/.venv-shot/bin/python shot.py`。
