---
"@inlang/paraglide-next": minor
---

`PrefixStrategy` now has a `prefixes` option to customize which prefix a language uses in the url. 

```ts
const strategy = PrefixStrategy<AvailableLanguageTag>({
    prefixes: {
        "de-CH": "swiss" // use /swiss instead of /de-CH in the URL
    } 
})
```

Prefixes must be unique and may not include slashes. 

Inspired by [Astro's custom locale paths](https://docs.astro.build/en/guides/internationalization/#custom-locale-paths).
