---
og:title: "Don't Lazy-Load Translations"
og:description: "Lazy-loading translations can seriously hurt your web-vitals. Here is what to do instead."
---

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

In order to lazy-load you need to execute the JS for your i18n runtime. This means that your app's entire module-graph needs to be fully downloaded, parsed and executed before you even start _loading_.

![Illustration of a loading-waterfall showing how lazy-loading takes longer over all](./assets/waterfall.png)

This is worse than a regular waterfall, since you usually don't need to execute JS before the waterfall starts. This can easily add 300ms+ to your app's time-to-interactive, regardless of how few/many messages you are loading.

In SPA apps it's even worse since your first render is entirely blocked until the translations are loaded.

This problem compounds further if you need to use fallback messages from other languages. You can't know if you need fallback messages until a langauges is loaded. For this reason many i18n libraries load the entire fallback-language stack immediately. 

## What should I do instead?

You need to find a way to statically link translations in the correct language on your pages.
This can be done one a few ways:
- Through `import` statements that only load the messages in the correct language
- By passing the necessary messages from the server to the client as part of the initial data payload

On content-focused sites static linking can be as simple as having separate page-components for each language. In them, only import the translations that you need. 

```txt
app/
├── de/
│   └── page.tsx
└── en/
    └── page.tsx
```

```ts
// de/page.tsx
import * as m from "@/paraglide/messages/de.js" // <-- Import only german messages

//en/page.tsx
import * as m from "@/paraglide/messages/en.js" // <-- Import only english messages
```

This works as long as you don't need to load data on the server. If you do, separate components for each language would require duplicating loading-logic.

In that case you are reliant on your framework being able to build your pages separately for each language. Lit, Angular and Qwik do just that. 

If your framework can't do that you will want to consider the nuclear option. Eagerly loading _all_ languages is almost always better than lazy-loading a single language. Yes, it's wasteful to your user's badwidth, but not _that_ wasteful. Text is very small; Entire novels fit into 350kB. The latency-savings from not lazy-loading offset the increase in bandwidth. 

This is most noticeable if you have fewer messages & fewer languages, but it persists even for large sites.

An example of the nuclear option in action is [galaxus.ch](https://www.galaxus.ch/). It's a very well-made NextJS site that loads very quickly, not despite loading all languages, but because of it.

This is why we chose _not_ to ship lazy-loading in our i18n library [ParaglideJS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs). Instead, we're pursuing ways of statically linking translations in the correct language. If that's not possible we fall back to loading all languages eagerly. 
