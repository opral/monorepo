---
"@inlang/core": patch
---

fix: return type of plugin.config

- Plugins shouldn't return arbitrary properties
- Making properties & Record<string, unknown> leads to loss of typesafety (lead to bugs)
