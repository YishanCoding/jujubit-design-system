---
name: jujubit-design-system
description: Build, design, or review JuJuBit pages and components (website, iOS, Android) with the JuJuBit design kit — tokens.css, components.css, the playground, and brand assets (logo, fonts, icon sprite, app icons, motion). Use whenever an agent creates a JuJuBit page, section, or landing page, picks colors/fonts/icons/buttons, or reviews design consistency.
---

# JuJuBit Design System (v2)

Live playground: https://playverseai.com/design/ · Source: https://github.com/YishanCoding/jujubit-design-system

This skill does not grant permission to change the Shopify production theme, release an app, or publish assets. Ask the owner first.

## Where the kit is

Use the first that exists:
1. `kit/` next to this file (installed from the skill zip — works offline).
2. The repo root, if you are working inside `jujubit-design-system`.
3. Online: `https://playverseai.com/design/tokens.css`, `.../components.css`, `.../assets/...`.

| File | Use it for |
|---|---|
| [platforms/web.md](platforms/web.md) | Shopify integration, tool landing pages, responsive rules, image and event contracts. |
| `tokens.css` | The only token set: colors, fonts (@font-face), type scale (Web + App), spacing, layout, radius, shadow, gradient, motion. |
| `components.css` | Ready `.jjb-*` classes: buttons, announce bar, nav (`--glass` over hero), section head, chips, dots, product card, tags, template card + track, steps, category card, trust, review, social, form, FAQ, footer, toast/dialog/sheet, skeleton and reveal. |
| [templates/tool-page/](templates/tool-page/README.md) | Standalone tool-page recipe: `index.html` and `tool-page.css`; proposed components stay outside the catalogue. |
| [templates/dashboard/](templates/dashboard/README.md) | Standalone internal dashboard starter with date controls, KPI, and a D3 trend card. |
| [references/dashboard.md](references/dashboard.md) | Dashboard tokens, layout, components, chart grammar, and content rules. |
| `playground.html` | Visual catalogue with copyable markup for every token and component. Open it first and copy markup from it instead of inventing. |
| `assets/README.md` | Every asset with its path and usage. |
| `assets/icons/sprite.svg` | 58 icons as `<symbol id="i-<name>">` plus `logo-wordmark`, all `currentColor`. |

## Dashboards

Internal data dashboards use the `.jjb-dash` kit and [dashboard specification](references/dashboard.md); start from [templates/dashboard/](templates/dashboard/README.md).
Inside `.jjb-dash`, the brand rules for orange primary actions, no accent buttons, four shadows, and Outfit/Bebas do not apply; use dashboard tokens and Inter.
Dashboard styles must not be used on the website, in the App, or in marketing assets.

## Source priority

- **Web section and component look** (nav, section head, chips, product card, template/category/trust/review cards, steps, social, FAQ, footer): the live jujubit.ai theme shipped 2026-10, tagged `[新版]`.
- **Colors, fonts, base button states, App components**: the design team's Figma (`[F]` / `[F稿]`).
- `[线上]` values (sale red, focus blue, stock colors, motion) are measured from the old live site and still await design confirmation. They are usable, but flag them in your delivery note.

## How to build a page

Read playground section 00 “设计思路” first for site principles and the 2026-10 UI rationale; items tagged “推断” still await design confirmation.

1. Open the playground and find the closest section (11 = homepage blocks, 16 = full page example). For tool pages, start from `templates/tool-page/index.html` and its README.
2. Link `tokens.css` then `components.css`. For Shopify, follow `platforms/web.md`: prefer a shared theme token asset loaded once with owner confirmation, or copy only the needed custom properties and their dependencies into the section's `{% style %}`. Keep the `--jjb-` names; do not load the repository TTFs in the theme.
3. Copy markup from the playground. Use `var(--jjb-*)` for every color, size, radius, shadow, and duration.
4. Icons: inline the sprite once, then `<svg class="jjb-icon"><use href="#i-cart"/></svg>`. Logo: `<svg viewBox="0 0 89 22" class="jjb-wordmark"><use href="#logo-wordmark"/></svg>`.
5. Check 1440 and 390 widths (no horizontal scroll), visible keyboard focus, and `prefers-reduced-motion`.
6. Run the [acceptance checklist](references/acceptance.md).

## Hard rules

- Tool pages use the standalone `templates/tool-page/` recipe and its `tool-page.css`, after shared tokens and components. Tool components and the retained tool tokens are **[待设计]** proposals.
- No file inputs, fake upload zones or generation API calls. Keep one primary action: a native GET form to `/products/customize-your-own`; the tail CTA submits the same form and preserves the selected style. Explain below the button that upload happens on the next page. Parameter names are **待开发确认**; destination support is unverified.
- Label original photos, AI previews, product renders and physical photos separately. AI previews are not physical products. Use matched, consented evidence or omit it. Unknown sample media must use the neutral label and alt “Sample image”.
- Do not hardcode factual numbers. Replace visibly marked slots with verified content before use; omit unverifiable claims.
- Keep native radio states, keyboard focus and local table scrolling. Check 390/768/1440/1600 widths and no-JS behavior using `platforms/web.md`.

- No new hex values, font sizes, radii, shadows, or easing curves. If something is missing, propose a semantic token name to the design owner; do not ship a literal.
- Bebas Neue only for headings, nav, and FAQ questions (uppercase). Outfit for everything else. App uses Outfit only.
- Orange `--jjb-brand-500` is for primary actions and emphasis. Hover is lighter (`400`), pressed darker (`600`). Disabled changes color, never opacity.
- Accent colors (`--jjb-accent-*`) are for illustration, marketing graphics, and tag backgrounds, never buttons or links.
- Only the 4 shadow tokens exist. Product cards and the logo have no shadow.
- Product cards: no brand subtitle, no Quick view; an optional second image fades in on hover. Section titles are centered Bebas 64 (mobile 28) with a right-aligned View All. Grid gap is 12px.
- Web vs App: `--jjb-app-*` tokens, `.jjb-app-btn`, and the sticker spec are App-only. On the website, template colors appear only inside template card images.
- Label evidence truthfully: AI previews, product renders, and real product photos are different things. Prices in the playground are samples.
- Brand people: when a page or asset needs a real-person image, use only the two spokespeople Maya and Danny (playground section 02, `assets/people/`), with the fixed English descriptions verbatim and their anchors kept (Maya: round natural afro + heather-grey tank, no glasses, face referenced from the Google Play feature graphic; Danny: glasses + orange beanie). On the people, orange appears only as Danny's beanie; otherwise orange goes on the backdrop and the box. Two energy registers, same faces: high-energy (full-bleed orange backdrop, arms out catching or lifting flying figurines, surprised/laughing; for store headers, feature graphics, ad first frames) and everyday (real interiors, warm light, knowing smile; for tutorials, later screenshots, social). Every figurine shown must be a full-color JuJuBit custom figurine on a JuJuBit wooden base or box, never grey/unpainted/pewter wargaming minis. Never use them in reviews, testimonials, or "Real Figurines. Real People." — those need real, consented customers. Tone: curious, playful, proud of their creation; not tearful or model-glam.
- Brand backgrounds: for store art, ads, posters and inserts, use the generated backgrounds in `assets/backgrounds/` (playground section 01 "品牌符号", file list under its ? note): `orange-pattern` (high-energy), `orange-swoosh` (high-energy with a person on the right white sweep, as on the live feature graphic), `light-pattern` (everyday/tutorial), `orange-plain` (text-heavy). Big, sparse, one-shade-darker glyphs only; never recolor, shrink into wallpaper, or put glyphs under body text. New sizes go into `SIZES` in `make_backgrounds.py`; full PNGs via `--png` (gitignored `out/`). Pick the product-line file (`-people` / `-pets` / `-trpg`) that matches the ad; files without a suffix use the core set only.
- Brand symbols: the glyphs come from `assets/brand-symbols/` (playground section 01 "品牌符号"), traced from the five white glyphs on the gift box side panel (core) plus one set per product line. One image = core + one line, never two lines mixed. New symbols follow the drawing rules there (thick round-capped outline about 1/7 of the height, hollow inside, ~10° forward lean, hand-made edges, 2–3 motion dashes/dots/plus marks, single color, objects not UI icons); never substitute solid, thin-line or emoji icons. Figure / couple / family symbols are not drawn yet; do not invent them.
- Packaging: any box shown in ads, people shots or unboxing images must match the real box (`assets/packaging/`): orange #FF5A11 square box, white JuJuBit wordmark on the front, a row of white glyphs on the side; 14×14×14cm magnetic flip box for 5–10cm figurines, 14×14×9cm double-door box under 5cm; foam insert, JUJUBIT poly bag, 10.8×8cm thank-you card. Pass `assets/packaging/flip-box.jpg` as a reference image; never let a model invent ribbons, kraft boxes, other colors or text.
- On the web use the SVG/PNG wordmark, not the 1.1MB `juju-mark.svg`. Motion files in `assets/motion/` are 720p previews.

## 处理设计页评论

只在人明确要求「处理设计页评论」时执行，不做定时任务。编辑模式只对授权人开放。
`data-mod` 是永久编号，永不改名；不删除仍有评论的模块，改名等于删除评论。
只改 `playground.src.html`，`modules.json` 和 `playground.html` 都由 build 生成。

1. 用 `creds run '<设计页 agent 凭据>' -- python3 tools/comments.py list` 读取待处理评论；凭据以 `AGENT_TOKEN`（或 `JJB_DESIGN_AGENT_TOKEN`）注入，不落盘。可加 `--status all` 或 `--json`。
2. 逐条按模块 id 搜索源文件并修改。输出里的 `file:line` 只作参考。
3. 执行 `python3 build.py`，并按仓库规则完成测试与 1440/390 视觉检查。
4. commit 并 push；遵守本次任务授权与仓库发布门禁，未获 push 或发布授权时只保留本地改动。
5. 推送成功后逐条执行 `creds run '<设计页 agent 凭据>' -- python3 tools/comments.py resolve <id> --commit <本仓库提交链接>`；未推送不 resolve。需要重新打开时用 `reopen <id>`。
6. 拿不准的评论不改，保持 open，在对话里列出请人确认。当前没有评论回复功能。

## Platform notes

Pick the platform with [platform routing](references/platform-routing.md). Web uses browser semantics; iOS follows Apple layout and Dynamic Type; Android follows Material adaptive behavior. The HTML playground is a browser reference and does not prove a SwiftUI or Compose build.

Sticker spec (App): cover and items 500×500 PNG, 30px padding on every side, 10px white outline.

## Known gaps (do not invent; escalate)

- Figma has no business components, web form/toast/dialog designs, motion tokens, focus states, or mobile type tokens; the kit fills these from the live site and marks them `[线上]`.
- The announcement bar gradient is an approximation. The hero campaign font (Sinistre) is not part of the system.
- Icon `report` is missing. Deep Blue in the external brand spec is contradictory (`#73BDF3` vs `#82C5F5`) and is not tokenized.
