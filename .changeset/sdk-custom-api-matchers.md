---
"@inlang/sdk": patch
---

`unused-message` is incomplete when a plugin finds message references through the deprecated `addCustomApi` (`app.inlang.ideExtension` matchers) but has no `analyzeUsage`, as it already was for matchers in `meta`. Before, a project with the m-function matcher and an older next-intl or i18next plugin got a complete analysis that only knew Paraglide's `m.*` calls, so every next-intl or i18next message was reported unused and could be deleted.
