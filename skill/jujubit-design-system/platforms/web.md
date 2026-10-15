# Web implementation — tool landing pages

Use this with `tokens.css`, `components.css` and playground section 19 (工具页), including `page.tool`. This is a template, not a published tool or a verified integration. New tool tokens and components are **[待设计]** proposals.

## 1. Shopify 落地形态

A new page is a Shopify Page assigned a custom JSON template such as `page.tool.json`. Compose it from sections; map each `.jjb-*` component to a section or block. Reuse the theme's announcement, navigation and footer once. The template has one main content landmark. Keep section settings scoped and form IDs unique across instances.

Recommended: put the custom properties from `tokens.css` in one theme asset named `jjb-tokens.css`, load it once in the layout, then load the needed component CSS. **This changes theme code and requires the theme owner's confirmation.** Exclude the repository's TTF `@font-face` rules. Fallback: copy only needed custom properties, including their referenced dependencies, into the section's `{% style %}`; retain every `--jjb-` name. Scope them to the section root. Never replace tokens with one-off literals.

The main entry is native HTML:

```html
<form id="tool-start" method="get" action="/products/customize-your-own"
      data-jjb-event="tool_cta_submit" data-jjb-tool="{{tool_slug}}">
  <fieldset class="jjb-tool-picker">
    <legend>Choose a style</legend>
    <label><input type="radio" name="style" value="{{style_value}}" checked
      data-jjb-event="tool_style_select" data-jjb-tool="{{tool_slug}}">{{style_name}}</label>
  </fieldset>
  <input type="hidden" name="utm_source" value="tool">
  <input type="hidden" name="utm_content" value="{{tool_slug}}">
  <button type="submit" class="jjb-btn jjb-btn--primary"
    aria-describedby="tool-next" data-jjb-event="tool_cta_submit"
    data-jjb-tool="{{tool_slug}}">Upload your photo</button>
  <p id="tool-next">Next: upload your photo.（下一步上传照片）</p>
</form>
<!-- A later CTA submits this same form, preserving its selected radio. -->
<button type="submit" form="tool-start" class="jjb-btn jjb-btn--white"
  data-jjb-event="tool_cta_submit" data-jjb-tool="{{tool_slug}}">Upload your photo</button>
```

**参数名待开发确认**：`style`, `utm_source`, and `utm_content` are proposed names. Browser GET serialization is supported by this markup; whether `/products/customize-your-own` reads, retains or acts on them is unverified. Confirm names, allowed style values and behavior with the developer before release. Do not claim preselection or attribution already works.

This page takes no files, calls no generation API and contains neither `input[type=file]` nor a fake drop zone. The existing destination owns upload, generation and ordering. No JavaScript is required for selection or navigation. Use the same form ID on the tail CTA's `form` attribute; never introduce a second primary action or a second form that loses the selected style.

Use only tool-intent terms here; keep product-intent terms on product pages. Keep keywords, headings, styles, URLs and facts as `{{slot}}` placeholders until reviewed. These are documentation placeholders, **not ready-made Liquid variable expressions** (in particular `{{fact:rating}}`). Map them to validated section settings/metafields. All factual numbers, including ratings, counts, prices and time claims, must come from the brand fact register; omit unverifiable facts. Do not put private register locations or research into public code.

## 2. 字体

Use Bebas Neue and Outfit already provided by the theme. Do not load the repository's TTFs on Shopify. If self-hosting is required, convert to WOFF2, use `font-display: swap`, and preload only one above-the-fold weight. Bebas supplies uppercase glyphs: author normal case in HTML, not manually capitalized text. Outfit handles body text and controls.

## 3. 断点与网格

The base breakpoint is `--jjb-bp-md: 768px`; the tool grid adds `--jjb-bp-lg: 1200px` **[待设计]**. Existing unrelated components retain their own rules. CSS variables do not work inside media conditions; component queries use matching `768px` / `1200px` literals. Update token and query together.

| Block | 390 | 768 | 1440 | ≥1600 |
|---|---|---|---|---|
| Container | 20px gutter | 30px gutter | Centered, 1220px content cap | Same centered cap; `--wide` remains fluid with gutter only, never enlarges type |
| Breadcrumb | Hide middle levels; ellipsis, Home and current remain | All levels, wrap if needed | Same | Same |
| Hero | One column: eyebrow, h1, subtitle, picker, CTA, note, media | Two equal columns | Two columns | Same; no additional type scale |
| Hero media | 4:5, below CTA | 1:1 | 1:1 | 1:1 |
| Picker | Internal horizontal scroll, visible native radios | Wrap within left column | Wrap | Wrap |
| Evidence | One column in source → preview → physical order | Three columns | Three columns | Three columns |
| Examples | Two columns | Three columns | Four columns (from 1200) | Four columns |
| Prose | Fluid | Max 720px | Max 720px | Max 720px |
| Comparison | Keyboard-focusable local horizontal scroller, sticky first column | Same, scroll only when needed | Same | Same |
| Related | Two category cards per row | Three per row | Three per row | Three per row |
| Tail CTA | Centered stack | Centered stack | Centered stack | Centered stack |
| Reused sections | Theme nav/footer responsive; static steps; trust/review cards in example grid; FAQ stacked | FAQ uses existing layout; cards follow example grid | Existing component rules | Same, no new type scale |

At 390×844 the hero submit button must be visible before scrolling. Verify after inserting real copy, including long words and translated text; do not clip headings or text to meet the check. Keep the announcement short. Do not add a tall menu or additional promotional material above the hero.

## 4. 标题与语义

One `h1` per tool page, containing `{{h1_keyword}}`. It may borrow section-heading styling, but must remain an `h1`. Follow with h2 section headings and h3 subsections; never skip levels. Use `button` for actions, `a` for links, `fieldset`/`legend` for radio groups and native `details`/`summary` for FAQ. Breadcrumb uses `nav aria-label="Breadcrumb"`, `ol`, and `aria-current="page"`; separators use sprite `chevron_right` with `aria-hidden="true"`.

Picker states: default, hover, checked, focus-visible and disabled. Native radio dots convey selection independently of color; keep the checked border and an outer keyboard-focus ring. Disabled changes colors, not opacity. A real option is disabled only when unavailable; do not implement a loading state for this static page. If no styles are available, omit the picker and allow the same destination action without a style parameter. Do not render a blank radio group.

`.jjb-prose`: h2 is Bebas headline-m, h3 is Outfit 600 headline-s. Links use `--jjb-tool-link` (primary text) and always have an underline; hover uses `--jjb-tool-link-hover` and a thicker underline. Keyboard focus remains visible. Long text uses `--jjb-measure: 720px`.

`.jjb-table` supports an optional `--striped` modifier. Wrap `.jjb-compare-table` in `.jjb-table-scroll` with `tabindex="0"`, `role="region"` and a meaningful accessible label. Preserve native table semantics, caption, column/row headers and a sticky first column. Use icons plus written outcomes; never encode comparisons in color alone. The opponent column is “Other options”; all claims require evidence.

`.jjb-related` reuses `.jjb-cat-card` with real internal URLs. `.jjb-cta-band` uses orange/white and the existing white button; it repeats the hero form's action. Every duplicated instance needs unique HTML IDs.

## 5. 图片与证据

Product media is 1:1; example cards are 4:5; hero is 4:5 on mobile and 1:1 on desktop. Existing component ratios take precedence on reused components (category/review cards remain square). Always set `width` and `height` to the source dimensions to reserve space. Use Shopify `image_url` with responsive `srcset`/`sizes` (or its `image_tag` helper):

```liquid
{{ section.settings.hero_image
  | image_url: width: 1200
  | image_tag: widths: '390, 600, 900, 1200',
    sizes: '(min-width: 768px) 50vw, 100vw',
    width: section.settings.hero_image.width,
    height: section.settings.hero_image.height,
    loading: 'eager', fetchpriority: 'high',
    alt: section.settings.hero_image.alt }}
```

Exactly one hero media image has `loading="eager" fetchpriority="high"`; remaining images are lazy. Alt describes actual visible content and distinguishes **AI preview**, **product render**, and **physical photo**. Do not call a render a physical photo.

`.jjb-proof-pair` is an ordered set: **Original photo → AI preview → Physical photo**, each with a text label using `.jjb-tag`. Original uses a plain border, preview a dashed border and soft surface, physical a double-weight solid border. AI previews are not physical products. Use a real matched, consented set; otherwise show explicit placeholder diagrams in the catalogue and omit the evidence section from a live page. Never use brand spokespeople as customer proof. The playground diagrams are placeholders, not factual evidence.

## 6. 性能

The tool first screen must render and work without JavaScript. No new third-party scripts. Aim for the hero media to be the LCP element: render it server-side, avoid lazy loading it, size and compress it for the rendered slot, and verify the actual LCP candidate on the final page. Do not promise an LCP result from the template alone. Do not copy the playground editor or its scripts into Shopify. The catalogue's iframe isolates the example from the catalogue's own h1; the page inside it has no scripts.

## 7. 结构化数据原则

BreadcrumbList and visible breadcrumbs must share one source. FAQPage and step-related structured data, when selected, must match visible wording verbatim; the SEO owner decides applicable types and eligibility. Tool pages must not output Product schema; products belong at `/products/customize-your-own`. Check inherited theme/app output too. Do not invent ratings or add unsupported structured-data claims.

## 8. 埋点

Interactive elements carry `data-jjb-event` and `data-jjb-tool="{{tool_slug}}"`. Use lowercase underscore names: `tool_cta_submit`, `tool_style_select`, `tool_example_click`, `tool_breadcrumb_click`, `tool_related_click`, `tool_faq_toggle`. These are hooks, not proof of collection. Use the existing analytics integration; do not add a script or send data from this template. Count form submission once on `submit` (both hero and tail buttons resolve to that form); use `change` for radios to avoid duplicate click/change events. Do not collect files or personal details.

Official implementation references: [JSON templates](https://shopify.dev/docs/storefronts/themes/architecture/templates/json-templates), [image_tag](https://shopify.dev/docs/api/liquid/filters/image_tag), [image_url](https://shopify.dev/docs/api/liquid/filters/image_url).
