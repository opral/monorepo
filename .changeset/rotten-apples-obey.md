---
"@inlang/paraglide-sveltekit": minor
---

Previously, if the default language was available on the root `/`, then it would still be available under `/[lang]`. This was never intended & no longer the case.

If you still want this behavior set the `prefixDefaultLanguage` to `"always"` in your `i18n` config.