---
"@inlang/plugin-icu1": patch
---

Export valid ICU that displays what the source displays, and the same again after an import, for plurals nested in selects and selects nested in plurals.

- A select or plural in a case of a plural lacked `other` when the plural's case had variants for some keys only. For example, `{h, select, a {{n, plural, other {{g, select, other {x}}}}} other {{g, select, b {{n, plural, one {one} other {# items}}} other {{n, plural, =5 {five} other {many}}}}}}` exported `one {{g, select, b {one}}}`, which ICU rejects. Each case of a plural now also gets the variants of less specific keys: of `other`, and for an exact value of its plural category. The export of the example has `one {{g, select, b {one} other {many}}}`.
- A literal "#" in a select nested in a plural was written as `'#'`, which ICU and next-intl don't read as a quote. The select now moves out of the plural instead, for all cases of the message.
- A plural with an offset and only `other`, e.g. `{n, plural, other {}}{m, plural, offset:1 other {b#}}`, and a plural repeated on an argument in some cases only now export the same again after an import.
