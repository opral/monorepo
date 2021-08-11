# inlang
Inlang makes i18n for your web apps as easy as:
1. installing the package 
2. `await loadTranslations(<locale>)` 
3. use the provided `t(<text>)` function
4. (auto generate translations via the [inlang dashboard](https://app.inlang.dev)) 

```JavaScript
await loadTranslations("de")

console.log(t("How is the weather in Berlin?"))

>>> "Wie ist das Wetter in Berlin?"
```

## Documentation

Head over to [app.inlang.dev](https://app.inlang.dev), create a project and follow the steps above. 

For better UX and SEO, the translations should be prefetched via SSR (Server Side Rendering). 
You can find an in depth documentation for the following frameworks: 

- [x] [SvelteKit](documentation/sveltekit.md)
- [ ] React (TODO)
- [ ] NextJS (TODO)
- [ ] VueJS (TODO)
- [ ] missing a framework? Open an issue :)


