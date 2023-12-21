---
"@inlang/paraglide-js-adapter-solidstart": patch
---

Support SolidStart Beta 2. (`@solidjs/start@0.4` and `@solidjs/router@0.10`)

Renames `languageTagInPathname` to `languageTagFromPathname`

Replaces `useLocationLanguageTag` with `useLocationPathname`

`translateHref` doesn't take `source_language_tag` param anymore