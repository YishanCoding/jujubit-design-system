# 数据看板设计语言（Dashboard kit）

> 来源：https://playverseai.com/jujubit/aso/dashboard/app-store-funnel（2026-10-20 抽取，来源标签 `[看板]`）。
> 可视目录：https://playverseai.com/design/dashboard（源文件仓库根目录 `dashboard.html`，独立页，不并入 playground）。
> 适用范围：内部数据看板（ASO/ASA/SEO/GEO/商店数据等 playverseai.com 上的报表页）。不用于 jujubit.ai 网站、App 或营销物料。

## 与品牌硬规则的关系（例外条款）

看板是内部分析工具，按 funnel 看板的既有语言统一，**不是**品牌页面：

- 主色用看板蓝 `--jjb-dash-blue`，不是品牌橙；字体用 Inter，不用 Bebas Neue / Outfit。
- 「橙色只给主操作」「accent 不做按钮」「只有 4 个阴影 token」三条品牌硬规则，在 `.jjb-dash` 根容器内不适用，由本文件的 `--jjb-dash-*` token 取代。
- 所有看板样式必须挂在 `.jjb-dash` 根容器下，不污染品牌组件；品牌组件也不放进看板。

## Tokens（全部进 tokens.css，前缀 `--jjb-dash-`）

| 用途 | token | 值 |
|---|---|---|
| 页面底 | `--jjb-dash-bg` | #F0F2F5 |
| 卡片 | `--jjb-dash-surface` | #FFFFFF |
| 次级面（表头、图例、输入框底） | `--jjb-dash-surface-1` | #F8F9FA |
| 三级面（进度轨道） | `--jjb-dash-surface-2` | #F0F2F4 |
| 边框 | `--jjb-dash-border` | #E3E6EB |
| 强边框 / 坐标轴 | `--jjb-dash-border-strong` | #D1D5DB |
| 文字 1–4 级 | `--jjb-dash-text` / `-text-2` / `-sub` / `-hint` | #111827 / #374151 / #6B7280 / #9CA3AF |
| 主色 | `--jjb-dash-blue` / `-blue-l` / `-blue-d` | #1D6AE5 / #EBF2FF / #1558C0 |
| 正向 | `--jjb-dash-green` / `-green-l` | #0EA770 / #E7F8F1 |
| 负向 | `--jjb-dash-red` / `-red-l` | #E53935 / #FEECEC |
| 警示 | `--jjb-dash-orange` / `-orange-l` / `-orange-d` | #F59E0B / #FEF3C7 / #B45309 |
| 辅助 | `--jjb-dash-purple` / `-purple-l` | #7C3AED / #F3F0FF |
| 中性 | `--jjb-dash-gray` / `-gray-l` | #6B7280 / #F3F4F6 |
| 阴影 | `--jjb-dash-el1` / `-el2` / `-el3` | `0 1px 3px rgba(0,0,0,.08),0 1px 2px rgba(0,0,0,.06)` / `0 4px 12px rgba(0,0,0,.08),0 1px 3px rgba(0,0,0,.06)` / `0 8px 24px rgba(0,0,0,.10),0 2px 6px rgba(0,0,0,.07)` |
| 动效 | `--jjb-dash-t` | `180ms cubic-bezier(.4,0,.2,1)` |
| 浮层底 | `--jjb-dash-tip-bg` | rgba(17,24,39,.95) |
| 字体 | `--jjb-dash-font` | 'Inter','SF Pro Display','Helvetica Neue',sans-serif（Google Fonts Inter 300–700） |

**渠道色（语义固定，跨看板不得换色）**：

| 渠道 | token | 值 |
|---|---|---|
| ASA 搜索广告 | `--jjb-dash-c-asa` | #E53935 |
| 自然搜索 / 汇总 / 默认产品页 | `--jjb-dash-c-search` | #1D6AE5 |
| Browse 浏览 | `--jjb-dash-c-browse` | #0EA770 |
| App Referrer | `--jjb-dash-c-appref` | #7C3AED |
| Web Referrer | `--jjb-dash-c-web` | #F59E0B |
| 不通过产品页 / 其他 | `--jjb-dash-c-other` | #6B7280 |
| Instagram | `--jjb-dash-c-instagram` | #E1306C |
| Facebook | `--jjb-dash-c-facebook` | #1877F2 |
| TikTok | `--jjb-dash-c-tiktok` | #111827 |
| YouTube | `--jjb-dash-c-youtube` | #FF0000 |
| Google | `--jjb-dash-c-google` | #4285F4 |
| 青色补位 | `--jjb-dash-c-teal` | #69C9D0 |

多系列（如多个 CPP）按序取色：asa、instagram、appref、browse、web、google、tiktok、teal。

## 布局

- Topbar：吸顶，高 58，`rgba(255,255,255,.9)` + `backdrop-filter: blur(14px)`，底边框；左起 28px 图标（圆角 7）→ 产品名 15/600 → `/` 分隔 → 页面标题 13 sub 色 → 弹性空白 → 数据源 badge（蓝）+ 时间范围 badge（绿）。
- 内容区 max-width 1280，padding 28/24/80。
- Section label：11px/600，大写，letter-spacing 1.2px，蓝色，左侧 3×13 蓝色竖条，上 32 下 14。
- 卡片：白底，圆角 16，el1，hover el2；内边距 24；卡片之间 20。
- 间距节奏只用 6/8/10/12/14/16/18/20/24/28/32。

## 组件（components.css，类名 `.jjb-dash-*`）

1. **date-bar**：白卡圆角 14；「时间范围」标签（12/600 大写 sub）+ 预设胶囊按钮（全周期/上周/近两周/近 30 天/近 90 天/自定义）+ `|` 分隔 + 日期输入（圆角 8，surface-1 底，focus 蓝边）+ 「聚合粒度」按日/按周 + 右对齐范围信息（数值加粗）。胶囊：圆角 20，1.5px 边框，默认 sub 色；hover 蓝边蓝字；active 蓝底白字。
2. **KPI tile**：6 列网格（≤900 三列，≤600 两列），gap 14；圆角 14，padding 18/16；6px 色点 → 数值 22/600 letter-spacing -.5 → 标签 11/500 sub → 副行 11（转化率 `→ 下载 x%`，或环比：绿 ▲ / 红 ▼）。hover 上浮 1px + el2。
3. **横向占比条**：名称列 110 → 轨道（surface-2，圆角 6，高 22）内填充色条，宽度够时白字标签在条内，否则 sub 色标签在条外 → 数值 70 右对齐 600 → 转化率 60 右对齐 sub。宽度变化 .6s。
4. **图表卡头**：左侧标题 16/650 + 副标题 12 sub（max 760）+ `?` 说明；右侧「图表/数字」分段切换 + 「复制图片」按钮 + 范围 badge。
5. **info-help `?`**：16px 圆，1px 强边框，11/700 hint 色，hover 蓝；悬停显示深色 tooltip，写口径细节。
6. **channel chip（多选筛选）**：圆角 18，1.5px 边框，surface-1 底，9px 色点 + 名称；on = 蓝浅底蓝边深蓝字；disabled = opacity .42、不可点；「+ 更多」用虚线边框 chip。
7. **分段切换 view-toggle**：外框圆角 10，active 蓝底白字。
8. **复制按钮**：圆角 10；成功态绿浅底绿边，失败态红浅底红边。
9. **Badge**：圆角 20，11.5/500，padding 5/12；蓝 / 绿 / 橙（橙字用 orange-d）。
10. **Legend**：surface-1 底圆角 10，padding 14/20；10px 方点（圆角 3）+ 12 sub 文字；线型图例用 18px 线段，虚线表示口径不同。
11. **Callout（口径说明）**：左 3px 蓝边，蓝浅色向右渐隐，圆角 0 10 10 0，12.5/1.7 深蓝字，开头写「口径：」。
12. **数字表**：外框 1px 边框圆角 10，可横滚；表头 surface-1 600 sub；数字右对齐、不换行；首列左对齐 sticky；行间 1px 边框；末行无边。表下右侧「展开全部」按钮。
13. **Tooltip / pin card**：tip-bg 深底白字，圆角 10，12/1.6，max 240；次要文字 hint 色。点击固定为 pin card，右上 18px 圆形关闭钮。
14. **空状态**：居中 13 sub，padding 44/20，文案说明「当前筛选范围没有可展示的 xx 数据」。

## 图表语法（d3 v7）

- 坐标轴：文字 11px sub 色；轴线和刻度 `--jjb-dash-border-strong`；Y 轴 5–6 个刻度；日期 X 轴文字旋转 -35°、右对齐。
- 网格线：`--jjb-dash-border`，`stroke-dasharray 3,4`。
- 折线：`curveMonotoneX`，线宽 2.2–2.4；数据点 r 3.2–3.4，白色 1.2 描边。
- **虚线 = 口径不同**（如「不通过产品页」用 `6,4`），图例和 callout 必须说明不能与实线直接比大小。
- **无效值断线不画**（如下载 > 浏览导致 CR > 100%），不补零、不插值，并在 `?` 说明原因。
- 柱 + 线双轴：柱为曝光（opacity .62），线为下载。
- 桑基图：节点按渠道色，连线用源→目标渐变，透明度 .45–.5；悬停高亮路径并弹出流入/流出明细。
- 图上数值标签：9.5/700，白色 2.6px 描边光晕（`paint-order: stroke`）。
- SVG 放在 `.jjb-dash-chart-wrap`（1px 边框，圆角 12，白到 surface-1 渐变底）里，min-width 840（≤720 屏 720），高 360，容器横向滚动，页面本身不横滚。

## 内容约定（最有辨识度，必须遵守）

1. 每个模块 = section label + 卡片；卡片内顺序：卡头 → 筛选 chip → 图/表 → legend → 口径 callout。
2. 每张图都有「口径：」callout 和至少一个 `?` 说明，写清分子/分母、数据源、已知偏差。
3. 每张趋势图都支持「图表 / 数字」切换和「复制图片」（html2canvas）。
4. 时间范围和聚合粒度是全页唯一控制，放顶部 date-bar；各卡片右上 badge 回显当前范围。
5. 中文界面，数字用千分位，百分比保留 1 位；缺失值显示「—」。
6. 示例与模板只用虚构数据，标注「示例数据」；不得内联真实 ASC/ASA 数据（/design 对拿到链接的人公开）。

## 交互规范（A–F）

- **A · 全局状态与日期**：`JJBDash.createState` 是唯一状态入口；日期预设、自定义日期和按日/按周粒度触发统一重绘。自定义才显示日期输入；范围信息和每张卡的 badge 同步更新。周以周一起算。
- **B · 趋势图**：整个绘图区 hover 最近日期，显示 4,3 虚线、可见系列圆点和深色明细；点击可固定多张 pin，同日再点取消，× 或双击关闭。无效值用 `null` 断线；不同口径用 6,4 虚线。resize 120ms 节流重绘。
- **C · 筛选**：渠道和产品页 chip 多选，至少保留一个；细分渠道折叠；当前范围无数据的选项禁用并说明原因；图例随选择更新。
- **D · 卡片工具**：每卡独立图表/数字视图，数字表按范围与粒度更新，首列 sticky，超出前 N 行可展开。复制图片使用 html2canvas scale 2、忽略 `data-no-copy`；`data-info` 显示视口内的帮助浮层；无数据时显示空状态。
- **E · 桑基图**：来源→产品页→渠道下载→总下载四层；源目标渐变连线；App/Web Referrer 分组框。hover 预览路径并列流入流出明细（最多 6 条）；点击节点锁定，点背景清除。
- **F · 其他图型**：曝光柱和下载线、评分堆叠柱与周末、Crash rate 版本筛选、审核阶段横向时间线各有示例；各卡同步全局范围与本卡视图。

所有公开示例使用确定性虚构数据，标注「示例数据」。运行 API 与完整示例见 [dashboard-kit.js](../templates/dashboard/dashboard-kit.js) 和仓库根目录 `dashboard.html`。
