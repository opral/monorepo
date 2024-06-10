---
"@inlang/paraglide-sveltekit": minor
---

Make `languageTag()` and message functions available in server-side load function. 

This eliminates the need for 
- `event.locals.paraglide.lang` anywhere.
- Manually passing the language tag to message functions that are used in load functions / actions.