---
imports:
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-callout.js
---

# Strategy

Paraglide JS comes with various strategies to determine the locale out of the box. 

The strategy is defined with the `strategy` option. The order of the strategies in the array defines the priority. The first strategy that returns a locale will be used.

In the example below, the locale is first determined by the `cookie` strategy. If no cookie is found, the `baseLocale` is used.

```diff
compile({
	project: "./project.inlang",
	outdir: "./src/paraglide",
+	strategy: ["cookie", "baseLocale"]
})
```

## Built-in strategies

### cookie 

The cookie strategy determines the locale from a cookie. 

```diff
compile({
	project: "./project.inlang",
	outdir: "./src/paraglide",
+	strategy: ["cookie"]
})
```

### baseLocale

Returns the `baseLocale` defined in the settings. 

Useful as fallback if no other strategy returned a locale. If a cookie has not been set yet, for example. 

```diff
compile({
	project: "./project.inlang",
	outdir: "./src/paraglide",
+	strategy: ["cookie", "baseLocale"]
})
```

### globalVariable

Uses a global variable to determine the locale. 

This strategy is only useful in testing environments, or to get started quickly. Setting a global variable can lead to cross request issues in server-side environments and the locale is not persisted between page reloads in client-side environments.

```diff
compile({
	project: "./project.inlang",
	outdir: "./src/paraglide",
+	strategy: ["globalVariable"]
})
```

### url

Determine the locale from the URL (pathname, domain, etc).

```diff
compile({
	project: "./project.inlang",
	outdir: "./src/paraglide",
+	strategy: ["url"]
})
```

The URL-based strategy uses the web standard [URLPattern](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API) to match and localize URLs. 

For example, the pattern `https://:domain(.*)/:locale(de|en)?/:path*` matches URLs like `https://example.com/de/about` and `https://example.com/about`. The named groups `domain`, `locale`, and `path` are used to extract and replace parts of the URL.

<doc-callout type="tip">Use https://urlpattern.com/ to test your URL patterns.</doc-callout>


#### Pathname-based url localization example

```
https://example.com/about 
https://example.com/de/about
```

```js
compile({
	project: "./project.inlang",
	outdir: "./src/paraglide",
	strategy: ["url"],
	urlPatterns: [
		{
			pattern: ":protocol://:domain(.*)::port?/:locale(de|en)?/:path(.*)?",
			// the original URL is https://example.com/about. 
			// hence, the locale is null
			deLocalizedNamedGroups: { locale: null },
			localizedNamedGroups: {
				// the en locale should have no locale in the URL
				// hence, the locale is null
				en: { locale: null },
				// the de locale should have the locale in the URL
				de: { locale: "de" },
			},
		},
	],
});
```

#### Domain-based url localization example

```
https://example.com/about
https://de.example.com/about
```

```js
compile({
	project: "./project.inlang",
	outdir: "./src/paraglide",
	strategy: ["url"],
	urlPatterns: [
		// defining the pattern during development which 
		// uses path suffixes like /en
		{
			pattern: ':protocol://localhost::port?/:locale(de|en)?/:path(.*)?',
				deLocalizedNamedGroups: { locale: null },
				localizedNamedGroups: {
					en: { locale: 'en' },
					de: { locale: 'de' }
				},
		},
		// production pattern which uses subdomains like de.example.com
		{
			pattern: ":protocol://:domain(.*)::port?/:path(.*)?",
			deLocalizedNamedGroups: { domain: "example.com" },
			localizedNamedGroups: {
				en: { domain: "example.com" },
				de: { domain: "de.example.com" },
			},
		},
	],
});
```

#### Adding a base path

You can add a base path to your URL patterns to support localized URLs with a common base path. 

For example, with the base path set to "shop":

- `runtime.localizeHref("/about")` will return `/shop/en/about`
- `runtime.deLocalizeHref("/about")` will return `/shop/about`


```js
const base = "shop";

compile({
	project: "./project.inlang",
	outdir: "./src/paraglide",
	strategy: ["url"],
	urlPatterns: [
		{
			pattern: ":protocol://:domain(.*)::port?/:base?/:locale(en|de)?/:path(.*)?",
			deLocalizedNamedGroups: { base },
			localizedNamedGroups: {
				en: { base, locale: "en" },
				de: { base, locale: "de" },
			},
		},
	],
});
```


### preferredLanguage

Automatically detects the user's preferred language from browser settings or HTTP headers.

- On the client: Uses [navigator.languages](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/languages)
- On the server: Uses the [Accept-Language header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language)

```diff
compile({
	project: "./project.inlang",
	outdir: "./src/paraglide",
+	strategy: ["preferredLanguage", "baseLocale"]
})
```

The strategy attempts to match locale in order of user preference:

1. First tries exact matches (e.g., "en-US" if supported)
2. Falls back to base language codes (e.g., "en")

For example:
- If user prefers `fr-FR,fr;q=0.9,en;q=0.7` and your app supports `["en", "fr"]`, it will use `fr`
- If user prefers `en-US` and your app only supports `["en", "de"]`, it will use `en`

## Write your own strategy

Write your own cookie, http header, or i18n routing based locale strategy to integrate Paraglide into any framework or app.

### Basics

Every time a message is rendered, Paraglide calls the `getLocale()` function under the hood to determine which locale to apply. By default, this will be the `baseLocale` defined in your settings. Calling `setLocale(locale)` anywhere in your code will update the locale stored by the runtime. Any calls to `getLocale()` after that (eg: when a new message is rendered) will return the newly set locale.

This behaviour is far too simple for most apps. Instead of starting with the default `baseLocale`, you will probably want to determine the locale based on cookies, a http header or a routing strategy. Likewise, if the locale is changed by the user, you might want to update some cookies, change the route, or trigger a rerender of the app.

Only two APIs are needed to define this behaviour and adapt Paraglide JS to your requirements: 

- `overwriteGetLocale` defines the `getLocale()` function that messages use to determine the locale
- `overwriteSetLocale` defines the `setLocale()` function that apps call to change the locale

Because the client and server have separate Paraglide runtimes, you will need to define these behaviours separately on the client and server. 

The steps are usually the same, irrespective of the strategy and framework you use:

1. Use `overwriteGetLocale()` function that reads the locale from a cookie, HTTP header, or i18n routing.
2. Handle any side effects of changing the locale and trigger a re-render in your application via `overwriteSetLocale()` (for many apps, this may only be required on the client side). 

_Read the [architecture documentation](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/architecture) to learn more about's Paraglide's inner workings._

### Dynamically resolving the locale (cookies, http headers, i18n routing, etc.)

To dynamically resolve the locale, pass a function that returns the locale to `getLocale()`. You can use this to get the locale from the `documentElement.lang` attribute, a cookie, a locale route, or any other source.

```js
import { m } from "./paraglide/messages.js";
import { overwriteGetLocale } from "./paraglide/runtime.js";

overwriteGetLocale(() => document.documentElement.lang /** en */);

m.orange_dog_wheel(); // Hello world!
```

On the server, you might determine the locale from a cookie, a locale route, a http header, or anything else. When calling `overwriteGetLocale()` on the server, you need to be mindful of race conditions caused when multiple requests come in at the same time with different locales. 

To avoid this, use `AsyncLocaleStorage` in Node, or its equivalent for other server-side JS runtimes. 

```js
import { m } from "./paraglide/messages.js";
import {overwriteGetLocale, baseLocale } from "./paraglide/runtime.js";
import { AsyncLocalStorage } from "node:async_hooks";
const localeStorage = new AsyncLocalStorage();

overwriteGetLocale(() => {
  //any calls to getLocale() in the async local storage context will return the stored locale
  return localeStorage.getStore() ?? baseLocale;
});

export function onRequest(request, next) {
  const locale = detectLocale(request); //parse the locale from headers, cookies, etc.
  // set the async locale storage for the current request
  // to the detected locale and let the request continue
  // in that context 
  return localeStorage.run(locale, async () => await next());
}
```

Or, for a SvelteKit specific example, in your `hooks.server.ts`:

```js
import { AsyncLocalStorage } from 'node:async_hooks';
import { sequence } from '@sveltejs/kit/hooks';
import { overwriteGetLocale, baseLocale } from './paraglide/runtime.js';

overwriteGetLocale(() => {
  //any calls to getLocale() in the async local storage context will return the stored locale
  return localeStorage.getStore() ?? baseLocale;
});

async function localeHandler({event, resolve}) {
  const locale = detectLocale(request);
  // set the async locale storage for the current request
  // to the detected locale and let the request continue
  // in that context
  return locale.run(locale, async() => await resolve(event));
}

async function mainHandler({event, resolve}) {
  //...your main server side request handler logic
  return await resolve(event);
}

export const handle = sequence(
  localeHandler, //goes first to set the locale context for the rest of the request
  mainHandler
);

```

#### Server-side rendering

1. Detect the locale from the request. 
2. Make sure that `overwriteGetLocale()` is cross-request safe on the server. 

Pseudocode logic on the server: 

```ts
import { overwriteGetLocale, overwriteSetLocale, setLocale, baseLocale } from "./paraglide/runtime.js";
import { AsyncLocalStorage } from "node:async_hooks";

const localeStorage = new AsyncLocalStorage();

// ✅ DO THIS
// ✅ when `getLocale()` is called inside a route handler
// ✅ this function will return the language for the current request
overwriteGetLocale(() => {
  return localeStorage.getValue() ?? baseLocale;
});

export function onRequest(request, next) {
  const locale = detectLocale(request);
	// set the async locale storage for the current request
	// to the detected locale and let the request continue
	// in the async context 
  return localeStorage(locale, async () => await next());
}
```