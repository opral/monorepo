---
"@inlang/plugin-icu1": patch
---

Import variants that select what ICU selects when a select or plural nested in a case sits ahead of the selector it is nested in.

Variants match selector by selector, so a selector that also encloses the select or plural it is nested in decides first. For `{g, select, b {B} other {{n, plural, one {X} other {{g, select, a {A} other {O}}}}}}`, `g=a, n=1` selected "A" instead of "X": the variant for `g=a, n=*` came before the one for `g=*, n=one` by `g`. This happened for a select nested, in a case of another selector, in a select on the same argument, and for selects and plurals that enclose each other in different places of a message, also with exact matches (`=5`). A variant now gets copies with the keys ahead that the variants of less specific cases match on, here `g=a, n=one`.
