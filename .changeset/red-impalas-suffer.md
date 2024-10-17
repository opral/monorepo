---
"@inlang/paraglide-sveltekit": patch
---

Fixed https://github.com/opral/inlang-paraglide-js/issues/243. 

Regression bug after 0.11.1 release. The cookie has been renamed from `paraglide:lang` to `paraglide_lang` but the SvelteKit load function was not updated from the old cookie name. 
