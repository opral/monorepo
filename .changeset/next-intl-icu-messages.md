---
"@inlang/plugin-next-intl": minor
---

Read and write next-intl messages as ICU MessageFormat, with the parser next-intl uses (`intl-messageformat`). Plurals (`=0`, `one`, `#`, `offset`), selects, selectordinals and nested ones import as selectors and variants, rich text tags (`<b>…</b>`, `<link>…</link>`) as markup, and number, date and time formats as annotated arguments. Editors can edit plural forms and add an exact `=0`, and the checks of `checkProject` and `checkBundle` compare the variants and tags of translations.

Before, the plugin split messages at braces, so `{count, plural, =0 {none} one {# item} other {# items}}` imported as the variables `count, plural, =0 {none`, `# item` and `# items`, which every check of a translation reported as missing and unknown variables, and messages with variants (e.g. a plural added in an editor) were written as one of their variants.

Also fixed:

- A new message is nested at the dots of its key (`Checkout.Summary.total` goes to `"Checkout": { "Summary": { "total": … } }`). Before, it was written as the flat key `"Checkout.Summary.total"`, which next-intl can't read: it shows the key instead. A new translation of an existing message goes where the message's other translations are, e.g. to a key with a dot.
- Literal `{`, `}` and tags in edited text are quoted (`'{'beta'}'`, `'<'b>`). Before, `Start {beta}` was written as is, and next-intl read `{beta}` as an argument.
- Quoted ICU (`'{name}'`, `it''s`) imports as the text next-intl displays.

Unchanged messages keep their text, so files only change where messages were edited. A message that isn't valid ICU is read as text and keeps its text. Projects that set a custom `variableReferencePattern` (e.g. `["{{", "}}"]`) keep reading messages as text with variables.
