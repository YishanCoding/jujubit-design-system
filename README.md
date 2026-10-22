# JuJuBit Design System

JuJuBit 独立站和 App 的设计规范：token、组件、素材，以及给 AI agent 用的 skill。

- 在线预览：https://playverseai.com/design/
- 安装 skill（Claude Code + Codex）：`curl -fsSL https://playverseai.com/design/install.sh | bash`

## 目录

| 路径 | 内容 |
|---|---|
| `tokens.css` | 唯一的 token 集：颜色、字体、字号、间距、圆角、阴影、动效 |
| `components.css` | `.jjb-*` 组件样式 |
| `playground.src.html` | 预览页源文件（改这个） |
| `playground.html` | 预览页产物（`build.py` 生成，不要手改） |
| `assets/` | 历史字体文件（已停用）、Logo、图标、App 素材、动效预览，清单见 `assets/README.md` |
| `skill/jujubit-design-system/` | agent skill 源文件 |
| `downloads/` | skill 下载包（`build.py` 生成） |
| `install.sh` | 一键安装脚本 |
| `worker/` | playverseai.com/design 的 Cloudflare Worker（只有仓库所有者部署） |

字体规范采用徐莹睿 2026-10-22 的 SF Pro 系统字体栈：Apple 设备用已安装的 SF Pro，其他平台回退系统字体。仓库不托管或嵌入 SF Pro 字体文件。

## 怎么改

1. 改 `tokens.css`、`components.css`、`playground.src.html`、`assets/` 或 `skill/`。
2. 本地跑 `python3 build.py`，用浏览器打开 `playground.html` 检查 1440 和 390 两个宽度。
3. commit 并 push 到 `main`。GitHub Action 会再构建一次，约 5 分钟后在线页面和 skill 包更新。

改动规则见 `AGENTS.md`。

编辑模式只对授权人开放。
