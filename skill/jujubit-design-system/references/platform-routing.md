# Platform routing

Choose the narrowest target first. For shared requests, state the shared semantic rule and then the implementation delta.

| Target | Read first | Apply |
|---|---|---|
| Independent website | [platforms/web.md](../platforms/web.md) | Semantic HTML, keyboard flow, responsive reflow, browser history, WCAG checks. |
| iOS | Not yet written; use official Apple guidance below | Apple Human Interface Guidelines, system navigation, safe areas, Dynamic Type, VoiceOver, and platform-standard controls. |
| Android | Not yet written; use official Android guidance below | Android design guidance, Material 3 where appropriate, window size classes, edge-to-edge, font scaling, TalkBack, and system Back behavior. |
| Shared pattern | Shared foundations and components notes are not yet written; use the [skill rules](../SKILL.md) | Business states, content meaning, accessibility intent, analytics names, and token semantics. |

Do not copy an approved Web layout into iOS or Android. Preserve the task and the semantic hierarchy while using native platform patterns.

Official references to prefer for platform-specific facts:

- Apple Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/
- Apple Design principles: https://developer.apple.com/design/human-interface-guidelines/design-principles
- Android design: https://developer.android.com/design/ui/mobile
- Material Design: https://m3.material.io/
