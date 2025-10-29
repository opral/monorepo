---
"@inlang/paraglide-js": patch
---

fix: make locale matching case-insensitive

Closes https://github.com/opral/inlang-paraglide-js/issues/549

This fixes an issue that locales containing uppercase characters like `pt-BR` failed to load when using `extractLocaleFromNavigator` or `extractLocaleFromHeader`.

The issue occurred because these functions converted locales to lowercase, while the comparison logic inside `assertIsLocale` and `isLocale` wasn't case-sensitive.

List of changes:
- Ensured locale comparisons in `assertIsLocale()` and `isLocale()` are fully case-insensitive.
- Made `assertIsLocale()` return the canonical-cased locale from `locales` instead of the raw input.
- Added new test coverage for case-insensitive behavior in `assertIsLocale()` and `isLocale()`.