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