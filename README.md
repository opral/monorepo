# inlang
Inlang makes i18n for your web apps as easy as:
1. installing the package   

   **NPM**    `npm install 'https://gitpkg.now.sh/samuelstroschein/inlang/packages/js?main'`  
   **YARN**  `yarn add 'https://gitpkg.now.sh/samuelstroschein/inlang/packages/js?main'`
   
   
3. `await loadTranslations(<your project domain>,<locale>)` 
4. use the provided `t(<text>)` function
5. (auto generate translations via the [inlang dashboard](https://app.inlang.dev)) 

```JavaScript
import { loadTranslations, setTranslations, t } from 'inlang'

setTranslations(await loadTranslations(<your domain>, "de"))

console.log(t("How is the weather in Berlin?"))

>>> "Wie ist das Wetter in Berlin?"
```

## Documentation

Head over to [app.inlang.dev](https://app.inlang.dev), create a project and follow the steps above. 

For better UX and SEO, the translations should be prefetched via SSR (Server Side Rendering). 
You can find an in depth documentation for the following frameworks: 

- [x] [SvelteKit](documentation/sveltekit.md)
- [x] [NextJS](documentation/nextjs.md)
- [ ] React (TODO)
- [ ] VueJS (TODO)
- [ ] missing a framework? Open an issue :)


