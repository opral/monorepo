---
"@inlang/plugin-next-intl": patch
---

Messages with a select or plural nested in a case ahead of the selector it is nested in, e.g. `{gender, select, female {She} other {{count, plural, one {one item} other {{gender, select, male {his items} other {their items}}}}}}`, now import with variants that select what next-intl displays: for `gender=male, count=1` "one item" instead of "his items". See `@inlang/plugin-icu1`.
