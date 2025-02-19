# Migrating to v2

1. Language tag has been renamed to locale to align with industry standards. 

```diff
-languageTag()
+getLocale()
-setLanguageTag()
+setLocale()
-availableLanguageTags
+availableLocales
```

2. The `onSetLanguageTag` has been removed in favor of simplifying writing [strategies/adapters](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/strategy). 


```diff

-onSetLanguageTag(() => {
  // do seomthing
})

+defineSetLocale(() => {
  // do something
})
```

3. If you use vite or another bundler, import the plugin directly from `@inlang/paraglide-js`

```diff
-import { paraglide } from "@inlang/paraglide-vite";
+import { paraglideVitePlugin } from "@inlang/paraglide-js";
```

4. Use `localizeHref()` in HTML 

```diff
-<a href="/about">
+<a href={localizeHref("/about")}>
  Something
</a>