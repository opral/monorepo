---
"@inlang/paraglide-js": minor
---

Add an opt-in `emitTsDeclarations` compiler flag to generate fresh `.d.ts` files (incl. `m` re-export and locale fallbacks) for locale-modules so IDEs stop reporting stale/missing message keys.

Closes https://github.com/opral/inlang-paraglide-js/issues/566
Closes https://github.com/opral/inlang-paraglide-js/issues/238
Closes https://github.com/opral/inlang-paraglide-js/issues/160

Example output (locale-modules):

```diff
  src/paraglide/
    messages/
      _index.js
+     _index.d.ts
      de.js
+     de.d.ts
      en.js
+     en.d.ts
    messages.js
+   messages.d.ts
```
