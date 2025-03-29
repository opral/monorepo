---
"@inlang/paraglide-js": patch
---

fix: compiling message bundles with case sensitive ids for the locale module output https://github.com/opral/inlang-paraglide-js/issues/490

Case sensitive ids led to duplicate exports in the locale module output. This has been fixed by adjusting the `toSafeModuleId()` used by the compiler internally to append a number of uppercase characters to de-duplicate the ids.

```diff
toSafeModuleId("helloworld")
 "helloworld"

toSafeModuleId("helloWorld")
- "helloworld"
+ "helloworld1"
```
