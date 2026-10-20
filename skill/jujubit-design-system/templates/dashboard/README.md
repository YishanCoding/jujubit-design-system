# 数据看板模板

入口为 [index.html](index.html)。这是一页可复制的内部看板骨架：topbar → date-bar → KPI → 趋势卡（图表/数字切换、复制图片、口径 callout）。所有数值均为**示例数据**；替换成真实数据前，要核对分子、分母、来源与缺失值规则。

## 使用

在仓库内用 HTTP 服务打开模板。页面依次加载 `../../../../tokens.css`、`../../../../components.css`、D3 7.8.5（cdnjs）和同目录的 `html2canvas.min.js`。后者是本地 MIT 许可副本，用来复制卡片图片，不产生新的运行时 CDN 依赖。

skill 下载包含整个 `templates/dashboard/` 目录及共享 `kit/`。解压后独立使用时，把 `index.html` 中的 `../../../../tokens.css` 和 `../../../../components.css` 分别改成 `../../kit/tokens.css`、`../../kit/components.css`。

## 结构与行为

| 顺序 | 组件 | 行为 |
|---|---|---|
| 1 | `.jjb-dash-topbar` | 显示产品、页名、数据源和时间范围。 |
| 2 | `.jjb-dash-date-bar` | 全页唯一时间范围和聚合粒度控制；选中预设会同步范围 badge。 |
| 3 | `.jjb-dash-kpis` | 六列网格，窄屏改为三列或两列。 |
| 4 | `.jjb-dash-card` | D3 折线、渠道 chip、图表/数字切换、tooltip/pin、legend、口径 callout；复制图片使用本地 html2canvas。 |

图表采用 `curveMonotoneX`、6 个 Y 轴刻度、旋转日期标签和 3.3px 数据点。虚线是不同口径，缺失值用 `null` 断线；卡片始终说明这两点。把示例数组换成真实数据时，保留无效值断线和「—」显示。数值用千分位，百分比保留 1 位。图表区域横向滚动，页面不横滚。

适用范围和品牌例外见 [dashboard.md](../../references/dashboard.md)。看板样式只在 `.jjb-dash` 内使用，不放到网站、App 或营销素材。
