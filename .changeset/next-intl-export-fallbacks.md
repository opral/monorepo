---
"@inlang/plugin-next-intl": patch
---

Exports of plurals nested in selects and selects nested in plurals are valid ICU that displays what the source displays, e.g. no select without `other` in a case of a plural and no `'#'` in a select nested in a plural. See `@inlang/plugin-icu1`.
