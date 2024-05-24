---
"@inlang/paraglide-next": patch
---

Improved HTTP Header SEO

`Link` headers are now only generated if the hrefs are unique for each language.
`Vary` headers are now generated if the hrefs aren't sufficient to determine the language.