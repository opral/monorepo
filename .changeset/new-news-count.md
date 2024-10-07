---
"@inlang/paraglide-sveltekit": patch
---

Fixes https://github.com/opral/inlang-paraglide-js/issues/234. 

Paraglide SvelteKit used the cookie name `paraglide:lang` which is
not compliant with rfc6265 standards for cookie names. SvelteKit
recently introduced strict cookie parsing which caused 
`paraglide:lang` to be rejected. 

The cookie name has been updated to `paraglide_lang` to be compliant.

```diff
-paraglide:lang
+paraglide_lang
```

