# Acceptance checklist

Before declaring a JuJuBit design-system task complete, check the applicable items.

1. The component has one stated purpose and no competing primary action.
2. Its content/data inputs and all material states are named, including loading, error, empty, unavailable, and recovery where relevant.
3. A generated preview, product render, and physical-product evidence are not visually or verbally conflated.
4. Keyboard, screen-reader, text-scaling, focus, reduced-motion, and color-independent feedback behavior are specified for the target platform.
5. Responsive/adaptive behavior preserves selected configuration and task context.
6. Platform rules are not misrepresented as shared numeric rules; CSS px, pt, and dp stay platform-specific.
7. New token proposals are semantic, documented, and do not introduce unexplained literal values.
8. Validation evidence matches the claim: browser preview is not native-app validation; static checks are not human UX approval; a local prototype is not a production release.

## Tool pages ([standalone template](../templates/tool-page/README.md))

- Exactly one h1 in `templates/tool-page/index.html`; h2/h3 hierarchy without skips. No iframe or catalogue dependency.
- All content slots are visibly marked; attribute-only slots have a visible key. Replace slots before use and remove template-only notices. Factual numbers are never hardcoded; use verified content or omit them.
- No file input, fake drop zone or generation request. Native GET form action is `/products/customize-your-own`; radios share `name="style"`; hidden fields are `utm_source=tool` and `utm_content={{tool_slug}}`.
- Both web notes and template README say **参数名待开发确认**. Do not infer destination behavior from successful serialization.
- Without JavaScript, selection works, hero and tail CTA submit the same selected style, and FAQ opens. One primary action; next-step upload explanation immediately follows the hero button.
- Picker: default/hover/checked/focus-visible/disabled; visible native radio selection, keyboard arrow navigation, disabled color change with no opacity reduction. Test local scrolling without page overflow and unavailable styles.
- Check 390×844, 768, 1440 and 1600: document scrollWidth ≤ innerWidth; hero submit within the mobile first screen; example grid 2/3/4/4 columns; centered cap, no enlarged type on wide screens.
- Check the complete standalone template and its component states. Table scrolls locally by keyboard; first column remains sticky; row/column headers, caption, icon-plus-text outcomes. Related cards have real internal link destinations before release.
- Original/AI/physical evidence has separate labels and border treatments. Rendered or generated media must never masquerade as physical evidence. Placeholder diagrams are not evidence; omit the section until a matched set exists.
- Evidence and related-card placeholder symbols are centered and capped at 96px using existing tokens. MINI_Pop.png has the neutral label and alt “Sample image”. Every image has width/height and truthful alt. One eager/high-priority hero; all remaining images lazy; theme images use responsive image_url/image_tag. Observe LCP in the final theme, not just this template.
- No new third-party scripts or tool-page JS dependency. Reuse theme fonts; no repository TTF on Shopify.
- Interactive elements carry lowercase underscore event hooks and tool slug; analytics must deduplicate CTA clicks into a single form-submit event. Hook presence is not proof of tracking.
- Run build and repository tests. Confirm the catalogue data-mod ID set matches c0832ba, template resource paths resolve, and tool-page.css has no literal colors/font sizes. Report browser and integration limitations explicitly.
