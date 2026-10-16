# 给 agent（Codex / Claude Code）的规则

这个仓库是 JuJuBit 设计规范。改动 push 到 main 后约 5 分钟会发布到 https://playverseai.com/design/ （设计规范）和 https://playverseai.com/brand （文案与品牌事实，源文件 `brand/index.html`），所以每次 push 前都要检查。

## 必须遵守

- 只改源文件：`tokens.css`、`components.css`、`playground.src.html`、`brand/index.html`、`assets/`、`skill/`、`README.md`。`brand/index.html` 的内容真源在 jujubit-seo-geo 仓库 `03-execution/content/copy-guide/` 与 `brand-constants.md`，先改那边再同步这里。不要手改 `playground.html`、`assets/icons/sprite.svg`、`downloads/`，它们由 `build.py` 生成。
- 新颜色、字号、圆角、阴影、动效先在 `tokens.css` 里加成 `--jjb-*` token（注释写来源标签 `[F]` / `[F稿]` / `[新版]` / `[线上]`），组件和页面只用 `var(--jjb-*)`。
- 改了组件或 token，同步改 `playground.src.html` 里对应的示例和 markup，以及 `skill/jujubit-design-system/SKILL.md` 里受影响的规则。
- 加图标：把 SVG 放进 `assets/icons/`（黑色改成 `currentColor`），文件名用小写加下划线。
- 不要提交大文件：单个文件不超过 5MB；视频先压到 720p 再放 `assets/motion/`。
- 不要改 `worker/` 和 `.github/`。
- 仓库已于 2026-10-16 转为 private，但 playverseai.com/design 与 /brand 仍对任何拿到链接的人可见：不要写入账号、密码、token；内部运营信息只放 /brand 且仅限 Yishan 已同意公开的范围。
- `data-mod` 永不改名，不删除仍有评论的模块；改名等于删除该模块的评论。先处理评论，再决定结构变更。
- 页面只改 `playground.src.html`；`modules.json` 由 `build.py` 生成，不要手改。行号只作参考，以 `data-mod` 搜索定位为准。

## 每次 push 前

0. 先 `git pull --rebase origin main`，拿到别人和自动构建的最新提交。push 被拒（non-fast-forward）时也是先 pull --rebase 再 push，**不要 `--force`**（仓库已禁止强推）。
1. `python3 build.py`，确认没有报错。
2. 打开 `playground.html`，在 1440 和 390 两个宽度检查：没有横向滚动，图片和图标都显示正常。
3. commit 信息写清楚改了什么，例如「按钮：hover 色改为 brand-400」。
4. `git push origin main`。
