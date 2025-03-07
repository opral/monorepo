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

### localStorage

Determine the locale from the user's local storage.

<doc-callout type="warning">If you use this stragety in combination with url, make sure that a strategy like `cookie` is used as well to resolve the locale in a request. The server has no access to localStorage.</doc-callout> 

```diff
compile({
	project: "./project.inlang",
	outdir: "./src/paraglide",
+	strategy: ["localStorage"]
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

#### Translated pathname-based URL localization

For pathnames where you want to localize the structure and path segments of the URL, you can use named pattern groups to match and replace specific segments. This approach enables language-specific routes like `/about` in English and `/ueber-uns` in German.

```
https://example.com/about
https://example.com/ueber-uns
```

##### Basic pathname localization

Here's a simple example with translated path segments:

```js
compile({
	project: "./project.inlang",
	outdir: "./src/paraglide",
	strategy: ["url"],
	urlPatterns: [
		{
			pattern: ":protocol://:domain(.*)::port?/:about?/:path(.*)",
			deLocalizedNamedGroups: { 
				"about?": "about" 
			},
			localizedNamedGroups: {
				en: { 
					"about?": "about" 
				},
				de: { 
					"about?": "ueber-uns" 
				},
			},
		},
	],
});
```

##### Working with optional parameters

URL patterns often contain segments that may or may not be present. For example, an e-commerce site might have URLs like:

- `http://example.com` (homepage)
- `http://example.com/bookstore` (category page)
- `http://example.com/bookstore/item` (product page)

To localize such patterns, use the **optional parameter syntax** with the `?` modifier:

```ts
urlPatterns: [
  {
    // Define the pattern with optional segments using the ? modifier
    pattern: 'http://example.com/:bookstore?/:item?',
    
    // Map optional segments back to base locale names
    deLocalizedNamedGroups: {
      'bookstore?': 'bookstore',  // Note: include the ? in the key
      'item?': 'item'
    },
    
    // Provide translations for each locale
    localizedNamedGroups: {
      de: {
        'bookstore?': 'buchladen',
        'item?': 'artikel'
      },
      en: {
        'bookstore?': 'bookstore', 
        'item?': 'item'
      }
    }
  }
]
```

This configuration enables:

| Original URL (EN) | Localized URL (DE) | Notes |
|-------------------|-------------------|-------|
| `http://example.com/bookstore` | `http://example.com/buchladen` | Single optional segment |
| `http://example.com/bookstore/item` | `http://example.com/buchladen/artikel` | Multiple optional segments |
| `http://example.com` | `http://example.com` | Base URL remains unchanged |


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

## Write your own strategy

Write your own cookie, http header, or i18n routing based locale strategy to integrate Paraglide into any framework or app.

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