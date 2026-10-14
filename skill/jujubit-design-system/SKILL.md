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
| `tokens.css` | The only token set: colors, fonts (@font-face), type scale (Web + App), spacing, layout, radius, shadow, gradient, motion. |
| `components.css` | Ready `.jjb-*` classes: buttons, announce bar, nav (`--glass` over hero), section head, chips, dots, product card, tags, template card + track, steps, category card, trust, review, social, form, FAQ, footer, toast/dialog/sheet, skeleton, reveal. |
| `playground.html` | Visual catalogue with copyable markup for every token and component. Open it first and copy markup from it instead of inventing. |
| `assets/README.md` | Every asset with its path and usage. |
| `assets/icons/sprite.svg` | 58 icons as `<symbol id="i-<name>">` plus `logo-wordmark`, all `currentColor`. |

## Source priority

- **Web section and component look** (nav, section head, chips, product card, template/category/trust/review cards, steps, social, FAQ, footer): the live jujubit.ai theme shipped 2026-10, tagged `[新版]`.
- **Colors, fonts, base button states, App components**: the design team's Figma (`[F]` / `[F稿]`).
- `[线上]` values (sale red, focus blue, stock colors, motion) are measured from the old live site and still await design confirmation. They are usable, but flag them in your delivery note.

## How to build a page

1. Open the playground and find the closest section (11 = homepage blocks, 15 = full page example).
2. Link `tokens.css` then `components.css`. For a Shopify section, copy only the needed custom properties into the section's `{% style %}` and keep the `--jjb-` names.
3. Copy markup from the playground. Use `var(--jjb-*)` for every color, size, radius, shadow, and duration.
4. Icons: inline the sprite once, then `<svg class="jjb-icon"><use href="#i-cart"/></svg>`. Logo: `<svg viewBox="0 0 89 22" class="jjb-wordmark"><use href="#logo-wordmark"/></svg>`.
5. Check 1440 and 390 widths (no horizontal scroll), visible keyboard focus, and `prefers-reduced-motion`.
6. Run the [acceptance checklist](references/acceptance.md).

## Hard rules

- No new hex values, font sizes, radii, shadows, or easing curves. If something is missing, propose a semantic token name to the design owner; do not ship a literal.
- Bebas Neue only for headings, nav, and FAQ questions (uppercase). Outfit for everything else. App uses Outfit only.
- Orange `--jjb-brand-500` is for primary actions and emphasis. Hover is lighter (`400`), pressed darker (`600`). Disabled changes color, never opacity.
- Accent colors (`--jjb-accent-*`) are for illustration, marketing graphics, and tag backgrounds, never buttons or links.
- Only the 4 shadow tokens exist. Product cards and the logo have no shadow.
- Product cards: no brand subtitle, no Quick view; an optional second image fades in on hover. Section titles are centered Bebas 64 (mobile 28) with a right-aligned View All. Grid gap is 12px.
- Web vs App: `--jjb-app-*` tokens, `.jjb-app-btn`, and the sticker spec are App-only. On the website, template colors appear only inside template card images.
- Label evidence truthfully: AI previews, product renders, and real product photos are different things. Prices in the playground are samples.
- On the web use the SVG/PNG wordmark, not the 1.1MB `juju-mark.svg`. Motion files in `assets/motion/` are 720p previews.

## Platform notes

Pick the platform with [platform routing](references/platform-routing.md). Web uses browser semantics; iOS follows Apple layout and Dynamic Type; Android follows Material adaptive behavior. The HTML playground is a browser reference and does not prove a SwiftUI or Compose build.

Sticker spec (App): cover and items 500×500 PNG, 30px padding on every side, 10px white outline.

## Known gaps (do not invent; escalate)

- Figma has no business components, web form/toast/dialog designs, motion tokens, focus states, or mobile type tokens; the kit fills these from the live site and marks them `[线上]`.
- The announcement bar gradient is an approximation. The hero campaign font (Sinistre) is not part of the system.
- Icon `report` is missing. Deep Blue in the external brand spec is contradictory (`#73BDF3` vs `#82C5F5`) and is not tokenized.
