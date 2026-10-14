> JuJuBit 设计规范 v2 素材清单 | 2026-10-14

# JuJuBit 设计素材清单

新页面要用的素材都在这个目录里。图标、字标和字体直接引用，不要重新导出，也不要换成别的版本。
来源有两类：Figma 文件（组件库 `pVvAxy9wIEWS6KONJ1KzoI`、对外规范 `B5D8pHkGH2iqqUERI15XR3`），以及飞书《JuJuBit 设计素材归档》`HyzZwK4lwiiQoRkpt2fcHIWinLd`。

## 字体 `fonts/`

| 文件 | 用途 | 来源 |
|---|---|---|
| `BebasNeue-Regular.ttf` | 标题、导航、tab。字形只有大写 | 飞书归档 `AbM5…` |
| `Outfit-VariableFont_wght.ttf` | 正文、按钮、App 全部文字。字重 100–900 | 飞书归档 `W4zP…` |

`tokens.css` 已经写好 `@font-face`，页面引用 `tokens.css` 就能用。Shopify 主题里已有这两款字体时，用主题自带的版本。

## Logo `logo/`

| 文件 | 用途 | 来源 |
|---|---|---|
| `wordmark-orange.svg` | 主字标，89×22，橙色 `#FF5A11`。sprite 里已有 `#logo-wordmark`，颜色跟随 `currentColor` | Figma 对外规范 |
| `wordmark-white.svg` | 白色字标，用在橙底或深色底上 | Figma 对外规范 |
| `wordmark-orange-transparent-512.png` | 字标位图，透明底。邮件、第三方平台等不能用 SVG 的地方用它 | 飞书归档 `LzNub…` |
| `wordmark-white-on-orange-512.jpg` | 橙底白字方图，用作头像或社媒 | 飞书归档 `HbvDb…` |
| `juju-mark.svg` | JuJu 3D 角色标，1.1MB。只用在品牌图里，网页上不用 | Figma |
| `juju-app-icon-square.svg` | App 图标矢量，1.1MB，网页上不用 | Figma |

Logo 源文件 `.ai`（飞书 `LI92…`）不进仓库。需要时从飞书归档下载。

## App `app/`

| 文件 | 用途 | 来源 |
|---|---|---|
| `app-icon-juju-square-1025.png` | App Store / 下载引导区用的方形图标 | 飞书 `EyGMb…` |
| `app-icon-juju-rounded-824.png` | 带圆角的图标，用在网页的下载 App 卡片上 | 飞书 `Boeab…` |
| `sticker-pack-spec.png` | 贴纸素材规范：封面和素材都是 500×500 PNG，四周留 30px，白色外描边 10px | 飞书 `MEyUbud…` |

## 图标 `icons/`

- 共 58 个 SVG，来自 Figma 组件库 `136:20281`–`136:20339`。黑色描边和填充已改为 `currentColor`。
- `sprite.svg` 由 `build.py` 生成，不要手改。每个图标是一个 `<symbol id="i-<文件名>">`，另外有一个 `logo-wordmark`。
- 用法：在页面里内联一次 sprite，然后写 `<svg class="jjb-icon" aria-hidden="true"><use href="#i-cart"/></svg>`。颜色跟随文字颜色。
- 加新图标：把 SVG 放进 `icons/`，然后跑 `python3 build.py`。
- 已知问题：缺 `report`（Figma `121:5974`，下载失败）。`close_circle` 和 `inspire` 里有灰色填充，不会跟随 `currentColor`。

## 动效视频 `motion/`

720p 压缩预览版（H.264，无声，透明底已铺白）。上线需要原片时找设计团队。

| 名称 | 文件 | 用途 |
|---|---|---|
| 品牌动效 横版 1920×1080 | `brand-landscape.mp4` | 独立站横幅、视频封面 |
| 品牌动效 方版 1200×1200 | `brand-square.mp4` | 独立站方形位、社媒 |
| 品牌动效 竖版 1080×1920 | `brand-portrait.mp4` | 手机首屏、短视频 |
| App 登录页 方版（快/慢） | `app-login-fast.mp4` / `app-login-slow.mp4` | App |
| App 开屏 | `app-splash.mp4` | App |
| App 下滑刷新 | `app-pull-refresh.mp4` | App |
| 骨架屏 | `skeleton.mp4` | 节奏参考（网页用 `.jjb-skeleton`） |
| 列表点赞 / 详情页点赞 | `like-list.mp4` / `like-detail.mp4` | App |
| 换头像 | `avatar-change.mp4` | App |
| 灵感饼干按钮 | `inspire-cookie.mp4` | App |
| 创作按钮弥散光效 | `create-glow.mp4` | App |
| 内容流上滑引导 | `feed-swipe-guide.mp4` | App |
| 撒花 | `confetti.mp4` | App 成功反馈 |


## 不在这里的素材

- 商品图：用 Shopify CDN 上的商品原图。playground 只用了 4 张做示例，价格也是示例。
- UI 截图包 `VAT2b…zip`、包装图、Onboarding `.mov`：在飞书归档里，还没有整理成规范。
