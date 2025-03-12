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
+	strategy: ["url", "cookie"]
})
```

The URL-based strategy uses the web standard [URLPattern](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API) to match and localize URLs. 

<doc-callout type="tip">Use https://urlpattern.com/ to test your URL patterns.</doc-callout>

<doc-callout type="info">On the server, the URL strategy will only trigger for requests with the `Sec-Fetch-Dest: "document"` header. This helps distinguish between document requests (browser page loads) and API requests, preventing unwanted redirects for API calls.</doc-callout>

<doc-callout type="warning">Make sure that a strategy like `cookie` is used as well to resolve a locale in server-side API requests that are not a `Sec-Fetch-Dest: "document"` request.</doc-callout> 

#### Locale prefixing

```
https://example.com/about 
https://example.com/de/about
```

```js
compile({
	project: "./project.inlang",
	outdir: "./src/paraglide",
	strategy: ["url", "cookie"],
	urlPatterns: [
		{
			pattern: "https://example.com/:path(.*)?",
			localized: [
				["en", "https://example.com/:path(.*)?"],
				["de", "https://example.com/de/:path(.*)?"],
			],
		},
	],
});
```

#### Translated pathnames

For pathnames where you want to localize the structure and path segments of the URL, you can use different patterns for each locale. This approach enables language-specific routes like `/about` in English and `/ueber-uns` in German.

```
https://example.com/about
https://example.com/ueber-uns
```

Here's a simple example with translated path segments:

```js
compile({
	project: "./project.inlang",
	outdir: "./src/paraglide",
	strategy: ["url", "cookie"],
	urlPatterns: [
		// Specific translated routes
		{
			pattern: "/about",
			localized: [
				["en", "/about"],
				["de", "/ueber-uns"],
			],
		},
		{
			pattern: "/products/:id",
			localized: [
				["en", "/products/:id"],
				["de", "/produkte/:id"],
			],
		},
		// Wildcard pattern for untranslated routes
		// This allows you to incrementally translate routes as needed
		{
			pattern: "/:path(.*)?",
			localized: [
				["en", "/:path(.*)?"],
				["de", "/:path(.*)?"],
			],
		},
	],
});
```


#### Domain-based localization

```
https://example.com/about
https://de.example.com/about
```

```js
compile({
	project: "./project.inlang",
	outdir: "./src/paraglide",
	strategy: ["url", "cookie"],
	urlPatterns: [
		// Include the localhost domain as otherwise the pattern will
		// always match and the path won't be localized
		{
			pattern: 'http://localhost::port?/:path(.*)?',
			localized: [
				["en", 'http://localhost::port?/en/:path(.*)?'],
				["de", 'http://localhost::port?/de/:path(.*)?']
			],
		},
		// production pattern which uses subdomains like de.example.com
		{
			pattern: "https://example.com/:path(.*)?",
			localized: [
				["en", "https://example.com/:path(.*)?"],
				["de", "https://de.example.com/:path(.*)?"],
			],
		},
	],
});
```

#### Adding a base path

You can add a base path to your URL patterns to support localized URLs with a common base path. 

For example, with the base path set to "shop":

- `runtime.localizeHref("/about")` will return `/shop/en/about`
- `runtime.deLocalizeHref("/about")` will return `/shop/about`

When using a base path, it's important to make it optional using the `{basepath/}?` syntax with curly braces and the `?` modifier. This ensures that paths without the base path will still be properly matched and have the base path added during localization.

```js
compile({
	project: "./project.inlang",
	outdir: "./src/paraglide",
	strategy: ["url", "cookie"],
	urlPatterns: [
		{
			pattern: "/{shop/}?:path(.*)?",
			localized: [
				["en", "/{shop/}?en/:path(.*)?"],
				["de", "/{shop/}?de/:path(.*)?"],
			],
		},
	],
});
```

This configuration enables:

| Original URL | Localized URL (EN) | Localized URL (DE) | Notes |
|-------------------|-------------------|-------------------|-------|
| `/about` | `/shop/en/about` | `/shop/de/about` | Path without base path gets base path added |
| `/shop/about` | `/shop/en/about` | `/shop/de/about` | Path with base path gets properly localized |

The curly braces `{}` with the `?` modifier ensure that the group is treated as optional, allowing both URLs with and without the base path to be matched and properly localized.

#### Making URL patterns unavailable in specific locales

You can configure certain URL patterns to be unavailable in specific locales by redirecting them to a 404 page or any other designated error page. 

This is useful when some content or features should only be accessible in certain languages.

```
https://example.com/specific-path       // Available in English
https://example.com/de/404              // Redirected to 404 in German
```

To implement this, map the pattern to your 404 page URL for the locales where the content should be unavailable:

```js
compile({
	project: "./project.inlang",
	outdir: "./src/paraglide",
	strategy: ["url", "cookie"],
	urlPatterns: [
		// 404 page definition.
		// 
		// 💡 make sure to define the 404 pattern
		// before a catch all pattern
		{
			pattern: "/404",
			localized: [
				["en", "/404"],
				["de", "/de/404"],
				// defining paths for locales that should not
				// be caught by the catch all pattern 
				// 
				// this will be matched first and the catch all
				// pattern will not be triggered and a redirect
				// from /de/unavailable to /de/404 will be triggered
				["de", "/de/unavailable"]
			],
		},
		// Path that's only available in English
		{
			pattern: "/specific-path",
			localized: [
				["en", "/specific-path"],     // Normal path in English
				["de", "/de/404"],            // Redirects to 404 in German
			],
		},
		// Catch-all pattern for other routes
		{
			pattern: "/:path(.*)?",
			localized: [
				["en", "/:path(.*)?"],
				["de", "/de/:path(.*)?"],
			],
		},
	],
});
```

When a user tries to access `/specific-path` in German, they will be redirected to `/de/404` instead. This approach allows you to:

- Make certain content available only in specific languages
- Create locale-specific restrictions for particular routes
- Implement gradual rollouts of features by language
- Handle legacy URLs that might only exist in certain locales

Note that other paths will still work normally through the catch-all pattern, so only the specifically configured paths will be unavailable.

#### Troubleshooting URL patterns

When working with URL patterns, there are a few important considerations to keep in mind:

##### Excluding paths is not supported

[URLPattern](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API#regex_matchers_limitations) does not support negative lookahead regex patterns. 

The decision to not support negative lookaheads is likely related to ReDoS (Regular Expression Denial of Service) attacks. Read [this blog post](https://blakeembrey.com/posts/2024-09-web-redos/) or the [CVE on GitHub](https://github.com/pillarjs/path-to-regexp/security/advisories/GHSA-9wv6-86v2-598j).

##### Pattern order matters

URL patterns are evaluated in the order they appear in the `urlPatterns` array. The first pattern that matches a URL will be used. This means that more specific patterns should come before more general patterns.

```js
urlPatterns: [
  // ❌ INCORRECT ORDER: The wildcard pattern will match everything, 
  // so the specific pattern will never be reached
  {
    pattern: "https://example.com/:path(.*)?", // This will match ANY path
    localized: [
      ["en", "https://example.com/:path(.*)?"],
      ["de", "https://example.com/de/:path(.*)?"],
    ],
  },
  {
    pattern: "https://example.com/blog/:id", // This will never be reached
    localized: [
      ["en", "https://example.com/blog/:id"],
      ["de", "https://example.com/de/blog/:id"],
    ],
  },
]

// ✅ CORRECT ORDER: Specific patterns first, then more general patterns
urlPatterns: [
  {
    pattern: "https://example.com/blog/:id", // Specific pattern first
    localized: [
      ["en", "https://example.com/blog/:id"],
      ["de", "https://example.com/de/blog/:id"],
    ],
  },
  {
    pattern: "https://example.com/:path(.*)?", // General pattern last
    localized: [
      ["en", "https://example.com/:path(.*)?"],
      ["de", "https://example.com/de/:path(.*)?"],
    ],
  },
]
```

##### Localized pattern order matters too

Within each pattern's `localized` array, the order of locale patterns also matters. When localizing a URL, the first matching pattern for the target locale will be used. Similarly, when delocalizing a URL, patterns are checked in order.

```js
// ❌ INCORRECT ORDER: The first pattern is too general
{
  pattern: "https://example.com/:path(.*)?",
  localized: [
    ["en", "https://example.com/:path(.*)?"], // This will match ANY path
    ["en", "https://example.com/en/blog/:id"], // This specific pattern will never be reached
  ],
}

// ✅ CORRECT ORDER: Specific patterns first, then more general patterns
{
  pattern: "https://example.com/:path(.*)?",
  localized: [
    ["en", "https://example.com/en/blog/:id"], // Specific pattern first
    ["en", "https://example.com/:path(.*)?"], // General pattern last
  ],
}
```

##### Example: Multi-tenant application with specific routes

For a multi-tenant application with specific routes, proper pattern ordering is crucial:

```js
compile({
  project: "./project.inlang",
  outdir: "./src/paraglide",
  strategy: ["url", "cookie"],
  urlPatterns: [
    // Specific product routes first
    {
      pattern: "https://:tenant.example.com/products/:id",
      localized: [
        ["en", "https://:tenant.example.com/products/:id"],
        ["de", "https://:tenant.example.com/produkte/:id"],
        ["fr", "https://:tenant.example.com/produits/:id"],
      ],
    },
    // Specific category routes next
    {
      pattern: "https://:tenant.example.com/categories/:name",
      localized: [
        ["en", "https://:tenant.example.com/categories/:name"],
        ["de", "https://:tenant.example.com/kategorien/:name"],
        ["fr", "https://:tenant.example.com/categories/:name"],
      ],
    },
    // General wildcard pattern last
    {
      pattern: "https://:tenant.example.com/:path(.*)?",
      localized: [
        ["en", "https://:tenant.example.com/:path(.*)?"],
        ["de", "https://:tenant.example.com/de/:path(.*)?"],
        ["fr", "https://:tenant.example.com/fr/:path(.*)?"],
      ],
    },
  ],
});
```

With this configuration:
1. Product URLs like `https://acme.example.com/products/123` will use the specific product pattern
2. Category URLs like `https://acme.example.com/categories/electronics` will use the specific category pattern
3. All other URLs will fall back to the general pattern

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