# 数据看板交互模板

[index.html](index.html) 是可直接在本仓库 HTTP 服务下运行的示例。所有数值由 `JJBDash.sampleData(4319)` 生成，均为**示例数据**。

页面按顺序加载 `tokens.css`、`components.css`、D3 7.8.5（cdnjs）、d3-sankey 0.12.3（jsdelivr）、本目录的 `html2canvas.min.js` 和 [dashboard-kit.js](dashboard-kit.js)。无构建步骤；全局 API 是 `window.JJBDash`。独立解压 skill 时，把 CSS 路径改为 `../../kit/` 下的同名文件。

```js
const rows = JJBDash.sampleData(4319); // 替换为校验过的数据
const dates = rows.map(row => row.date);
const state = JJBDash.createState({ preset: '近 90 天' });
JJBDash.dateBar(bar, state, dates, rangeBadges);
JJBDash.chips(chipRoot, state, 'channels', channels, isAvailable);
JJBDash.viewToggle(card, state, 'trend');
state.subscribe(() => {
  const selected = JJBDash.inRange(rows, JJBDash.range(state.value, dates));
  const grouped = JJBDash.aggregate(selected, state.value.granularity, ['downloads']);
  JJBDash.lineChart(plot, grouped, [{ key: 'downloads', name: '下载', color: 'c-search' }]);
  JJBDash.table(numberRoot, [{ label: '日期', value: row => row.label }], grouped);
});
```

可用渲染器还有 `barLineChart`、`stackedBarChart`、`timelineChart`、`sankey`；工具有 `copyImage`、`infoTip`、`legend`、`empty` 和 `crosshair`。完整的多卡示例、可复制 Markup 与 JS 调用在仓库根目录 [dashboard.html](../../../../dashboard.html)。筛选与范围共同驱动 KPI、图、表、badge，卡片视图保存在 `state.views`。缺失值使用 `null`，不要补零；接真实数据时先核对每个指标的分子、分母和口径。

## 本地浏览器验收

在仓库根目录先运行 `python3 -m http.server 8765`，再运行 `python3 skill/jujubit-design-system/templates/dashboard/verify.py`。脚本检查规范页和模板的 1440/390 布局、交互与脚本错误，并把全页、桑基 hover、趋势 pin 截图写入仓库根目录 `.codex-shots/v2-*.png`。截图仅供本地验收，不要 `git add`。
