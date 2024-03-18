# Don't Lazy-Load Translations

Most i18n libraries encourage you to lazy-load translations by language. 

```ts
init({
    translations: {
        en: async () => await import("./en.json"),
        de: async () => await import("./de.json"),
    }
})
```

This is well-intentioned. You shouldn't send what you don't use. Unfortunately it's also very bad for your web-vitals, specifically Time-to-Interactive. 

In order to lazy-load you need to execute the JS for your i18n runtime. This means that your app's entire module-graph needs to be fully downloaded, parsed and executed before you even start _loading_. This is worse than a regular waterfall, since you usually don't need to execute before loading. This can easily add 300ms+ to your app's time-to-interactive, regardless of how few/many messages you are loading.

## What should I do instead?
You need to find a way to statically link translations in the correct language on your pages. Either through imports, or by eagerly loading the needed translations in load functions.

If you have a content-focused site this may be as simple as having separate components for each language. In them you can only import the translations that you need. 

```
app/
├── de/
│   └── page.tsx
└── en/
    └── page.tsx
```

```ts
// de/page.tsx
import * as m from "@/paraglide/messages/de.js" // <-- Import only german messages
```

This works great as long as you don't need to load data. If you do, having separate components for each language would require duplicating your load-logic. We don't want that. 

In that case you are reliant on your framework being able to build your pages separately for each language. Lit, Angular and Qwik do just that. If your stack can't, you may want to consider the nuclear option. 

It's usually better to send over _all_ languages egaerly than to lazy load a single language. This is wasteful of your user's badwidth, but it's not _that_ wasteful. Text is very small; Entire novels fit into 350kB. The latency-savings from not lazy-loading more than offset the increase in bandwidth. 

An example of the nuclear option in action is [galaxus.ch](https://www.galaxus.ch/). It's a very well-made NextJS site that loads very quickly. Not despite loading all languages, but because of it.

This is why we chose _not_ to ship lazy-loading in our i18n library [ParaglideJS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs). Instead, we're pursuing ways of statically linking translations in the correct language. If that's not possible we fall back to loading all languages eagerly. 