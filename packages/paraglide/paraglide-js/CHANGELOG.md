# @inlang/paraglide-js

## 2.3.2

### Patch Changes

- 4ea9e7a: fix: ensure that async custom setLocale funcs resolve with reload: false

## 2.3.1

### Patch Changes

- 090964b: fix(runtime/set-locale.js): ensure reload waits for async custom setLocale funcs https://github.com/opral/monorepo/pull/3692

## 2.3.0

### Minor Changes

- bfe8518: Crash the build process (for example during `vite build`) if paraglide can't compile the project.
- Removed local account loading which suddenly led to crashes for some users.

## 2.2.0

### Minor Changes

- 69ac911: Add support for async custom server strategies with `extractLocaleFromRequestAsync`

  This change introduces a new `extractLocaleFromRequestAsync` function that supports asynchronous custom server strategies, enabling use cases like fetching user locale preferences from databases.

  ## What's Changed
  - **New Function**: Added `extractLocaleFromRequestAsync` that supports async custom server strategies
  - **Middleware Update**: Server middleware now uses the async version to support async custom strategies
  - **Breaking Change**: The synchronous `extractLocaleFromRequest` no longer supports custom server strategies
  - **Improved Documentation**: Added comprehensive examples and usage guidance

  ## Migration Guide

  ### For users with custom server strategies:

  **Before:**

  ```js
  // This no longer works in sync version
  defineCustomServerStrategy("custom-database", {
  	getLocale: async (request) => {
  		return await getUserLocaleFromDatabase(request);
  	},
  });

  const locale = extractLocaleFromRequest(request); // Won't call async custom strategies
  ```

  **After:**

  ```js
  // Use the async version for custom strategies
  defineCustomServerStrategy("custom-database", {
  	getLocale: async (request) => {
  		return await getUserLocaleFromDatabase(request);
  	},
  });

  const locale = await extractLocaleFromRequestAsync(request); // Supports async custom strategies
  ```

  ### For users calling `extractLocaleFromRequest` directly:

  If you're using `extractLocaleFromRequest` directly in your code without custom strategies, no changes are needed. For custom server strategies, switch to `extractLocaleFromRequestAsync`.

  The server middleware automatically uses the async version, so no changes are needed for standard middleware usage.

  Closes https://github.com/opral/inlang-paraglide-js/issues/527

### Patch Changes

- 5589e30: (likely) fix: handler is of type `unknown` ts error https://github.com/opral/inlang-paraglide-js/issues/529
- 3712f09: Fix cookieDomain default behavior for better server/client cookie compatibility.

  When `cookieDomain` is undefined or empty, cookies are now set without a domain attribute, scoping them to the exact current domain only (no subdomains). This fixes compatibility issues with server-side cookies that don't include a domain attribute.

  **Before**:

  ```js
  // When cookieDomain was undefined, cookies were set as:
  document.cookie =
  	"PARAGLIDE_LOCALE=en; path=/; max-age=34560000; domain=example.com";
  // This made cookies available to subdomains
  ```

  **After**:

  ```js
  // When cookieDomain is undefined, cookies are now set as:
  document.cookie = "PARAGLIDE_LOCALE=en; path=/; max-age=34560000";
  // This scopes cookies to the exact current domain only
  ```

  **Migration**:
  - If you want the previous behavior (subdomain sharing), explicitly set `cookieDomain` in your configuration:

  ```diff
  paraglideWebpackPlugin({
    project: './project.inlang',
    outdir: "./src/paraglide",
  + cookieDomain: 'example.com'
  })
  ```

## 2.1.0

### Minor Changes

- 4255bd5: Provide functions for getting the preferred language on server and client.

  This defines two new functions for getting the preferred language:
  - `extractLocaleFromHeader`: Extracts the locale from the accept-language header on the server.
  - `extractLocaleFromNavigator`: Extracts the locale from the navigator.languages array on the client.

  The code was already present in the `@inlang/paraglide-js` package, but it was not exported. Now it is exported so that
  it can be used in custom strategies.

- dc287f1: Implement custom strategy concept for locale resolution.

  This introduces a new way to define custom locale resolution strategies alongside built-in strategies. Custom strategies provide a cleaner, more composable approach compared to overwriting `getLocale()` and `setLocale()` functions directly.

  **New APIs:**
  - `defineCustomClientStrategy()`: Define custom strategies for client-side locale resolution
  - `defineCustomServerStrategy()`: Define custom strategies for server-side locale resolution

  **Key features:**
  - Custom strategies must follow the pattern `custom-<name>` where `<name>` contains only alphanumeric characters
  - Can be combined with built-in strategies in the strategy array
  - Respect strategy order for fallback handling
  - Support both client and server environments
  - Provide better error isolation and type safety

  **Usage example:**

  ```js
  import { defineCustomClientStrategy } from "./paraglide/runtime.js";

  defineCustomClientStrategy("custom-sessionStorage", {
  	getLocale: () => sessionStorage.getItem("user-locale") ?? undefined,
  	setLocale: (locale) => sessionStorage.setItem("user-locale", locale),
  });
  ```

  Then include in your strategy configuration:

  ```js
  compile({
  	strategy: ["custom-sessionStorage", "cookie", "baseLocale"],
  });
  ```

### Patch Changes

- 4c0b997: perf(paraglide): improve bundle size by removing message id fallback for fully translated messages
- 9621803: Add Vary: Accept-Language header when preferredLanguage strategy is used

  Paraglide middleware now automatically sets the `Vary: Accept-Language` header when performing redirects based on the `preferredLanguage` strategy. This indicates to clients (CDN cache, crawlers, etc.) that the response will be different depending on the `Accept-Language` header, ensuring proper caching behavior and SEO compliance.

  Closes https://github.com/opral/inlang-paraglide-js/issues/522

- Updated dependencies [22089a2]
  - @inlang/sdk@2.4.9

## 2.0.13

### Patch Changes

- 688c7c8: Add support for callbacks in server middleware
- 635861b: `extractLocaleFromUrl()` now uses a cache for the last value.

  Useful on the client-side where the same URL is being extracted many times for each message on a given page.

## 2.0.12

### Patch Changes

- 31337ba: expose `createParaglide()`
- Updated dependencies [56acb22]
  - @inlang/sdk@2.4.8

## 2.0.11

### Patch Changes

- de0439f: Add domain property to cookie options.

  ```diff
  paraglideVitePlugin({
    project: './project.inlang',
    outdir: "./src/paraglide",
  + cookieDomain: 'example.com'
  }),
  ```

## 2.0.10

### Patch Changes

- d16e853: fix: [2.0.8] Adds extra \*/ in generated .js files https://github.com/opral/inlang-paraglide-js/issues/493

## 2.0.9

### Patch Changes

- Updated dependencies [bd2c366]
  - @inlang/sdk@2.4.7

## 2.0.8

### Patch Changes

- 5258af0: fix: compiling message bundles with case sensitive ids for the locale module output https://github.com/opral/inlang-paraglide-js/issues/490

  Case sensitive ids led to duplicate exports in the locale module output. This has been fixed by adjusting the `toSafeModuleId()` used by the compiler internally to append a number of uppercase characters to de-duplicate the ids.

  ```diff
  toSafeModuleId("helloworld")
   "helloworld"

  toSafeModuleId("helloWorld")
  - "helloworld"
  + "helloworld1"
  ```

## 2.0.7

### Patch Changes

- 48931f5: make `output-structure: locale-modules` the default for dev builds https://github.com/opral/inlang-paraglide-js/issues/486
- Updated dependencies [49a7880]
  - @inlang/sdk@2.4.6

## 2.0.6

### Patch Changes

- 3fa27c0: fix: duplicate (case sensitive) message keys leading to compile error when using `output-structure: locale-modules`. closes https://github.com/opral/inlang-paraglide-js/issues/487
- 02c2d34: improve: compiler should log warnings when plugins can not be imported
- Updated dependencies [083ff1f]
  - @inlang/sdk@2.4.5

## 2.0.5

### Patch Changes

- 698b9a9: add `cookieMaxAge` option to compiler and runtime

  Closes https://github.com/opral/inlang-paraglide-js/issues/483
  - Introduced `cookieMaxAge` option to `CompilerOptions`, allowing configuration of cookie expiration time.
  - Adjusted tests to verify `max-age` in cookies.

## 2.0.4

### Patch Changes

- @inlang/sdk@2.4.4

## 2.0.3

### Patch Changes

- cf404e0: improve: handle duplicate inputs https://github.com/opral/inlang-paraglide-js/issues/479

## 2.0.2

### Patch Changes

- a6c43ea: fix: error handling in paraglideMiddleware breaks SvelteKit features that rely on errors being thrown

## 2.0.1

### Patch Changes

- b906c0c: fix: window undefined bug in webpack
  - @inlang/sdk@2.4.3

## Paraglide JS 2.0 🚀

Paraglide JS 2.0 had three main goals which have all been achieved:

1. Use the new inlang SDK v2 which supports variants [#201](https://github.com/opral/inlang-paraglide-js/issues/201).
2. Unify the API across any framework [#217](https://github.com/opral/inlang-paraglide-js/issues/217).
3. Support any i18n strategy (cookie, url, domain, session, etc).

- 🌐 **Variants (pluralization) are now supported** [docs](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/variants)
- 😍 **No more adapters or providers are needed** (!)
- 🛣️ **Any strategy (url, cookie, local storage) is now supported** [docs](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/strategy)

In addition, Paraglide JS 2.0 comes with:

- 🌟 **Nested message keys** are now supported (most requested feature!)
- ✨ **Auto-imports** when writing `m.` (no more manual `import * as m`)
- 🍌 **Arbitrary key names** including emojis via `m["🍌"]()`
- 🔄 **Incremental migration** to Paraglide JS is now possible
- 🏘️ **Multi-tenancy support** for domain-based routing
- 🔧 **Exposing the compiler API** for advanced workflows
- 🛣️ **Configurable routing strategies** (URL, cookie, domain, etc)
- 🧪 **Experimental per-locale splitting** for decreasing bundle sizes
- 🌐 **Framework-agnostic server middleware** for SSR (SvelteKit, Next.js, etc)

### Highlights

#### Interactive benchmark

Check out the [benchmark](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/benchmark) to see how Paraglide JS compares to other libraries like i18next.

[![Benchmark Visualization](https://cdn.jsdelivr.net/gh/opral/monorepo@main/inlang/packages/paraglide/paraglide-js/assets/interactive-benchmark.png)](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/benchmark)

#### No more adapters are needed

```diff
- @inlang/paraglide-sveltekit
- @inlang/paraglide-next
+ // No more adapters are needed
```

#### 🚀 Framework-Agnostic Server Middleware

Docs are [here](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/server-side-rendering)

- **New**: Universal `paraglideMiddleware()` works in any SSR framework
- **Built-in**: Automatic locale redirects when user preference detected

```ts
// SvelteKit example - same pattern works for Next.js, Astro, etc.
import { paraglideMiddleware } from "./paraglide/server.js";

export const handle = ({ event, resolve }) => {
	return paraglideMiddleware(event.request, () => resolve(event));
};
```

#### 🛣️ Configurable Routing Strategies

Read more about strategies on the [docs](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/strategy).

Literally anything is now possible. URL-based, domain-based, path-based, cookie-based, etc.

```js
paraglide({
	strategy: [
    "url",
    "cookie",
    "preferredLanguage",
    "..."
  ],
}),
```

#### 🔧 Exposing the compiler API

- **New**: Direct compiler access for advanced workflows
- **Why**: Enable CI/CD pipelines and custom tooling
- **Benefit**: Full control over compilation timing/caching

```ts
// New programmatic API
import { compile } from "@inlang/paraglide-js";

await compile({
	project: "./project.inlang",
	outdir: "./src/paraglide",
});
```

#### 🍌 Arbitrary key names

- **New**: Arbitrary key names including emojis via `m["🍌"]()
- **Why**: Enable nesting of messages
- **Benefit**: More expressive and fun translations

```ts
// Paraglide 1.0
m.some_message(); // ✅ Works
m.nested.message(); // 💥 Error

// Paraglide 2.0
m.some_message(); // ✅ Works
m["nested.message"](); // ✅ Works

// Even emojis are supported
m["🍌"]();
```

#### 🔄 Incrementally migrating to Paraglide JS

Paraglide JS 2.0 can load multiple [translation file formats](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/file-formats). As such, you can incrementally migrate to Paraglide JS with existing translation file formats.

```js
// In this example, Paraglide JS compiles i18next translation files
// which enables using both i18next and Paraglide JS.

import i18next from "i18next";
import { m } from "./paraglide/messages.js";

console.log(i18next.t("greeting", { name: "World" }));
console.log(m.greeting({ name: "World" }));
```

#### 🏘️ Multi-tenancy support

Paraglide JS 2.0 supports multi-tenant applications. Read more about it [here](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/multi-tenancy).

```
# Domain-based with sub-locale
customer1.fr/about         → French (default)
customer1.fr/en/about      → English version

# Domain-based with root locale
customer2.com/about        → English (default)
customer2.com/fr/about     → French version

# Path-based for any domain
example.com/en/about       → English
example.com/fr/about       → French
app.example.com/en/about   → English
app.example.com/fr/about   → French
```

### Migrating breaking changes

If problems arise, please refer to the framework-specific getting started guide:

- [SvelteKit](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/sveltekit)
- [Next.js](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/next)
- [Astro](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/astro)
- [Vite](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/vite)
- [React Router](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/react-router)

#### `LanguageTag` got renamed to `locale`

To align with industry standards, we renamed `LanguageTag` to `locale`.

```diff
-languageTag()
+getLocale()
-setLanguageTag()
+setLocale()
-availableLanguageTags
+locales
```

#### Remove adapters `@inlang/paraglide-*` from your dependencies

````diff
// package.json
{
  "dependencies": {
-    "@inlang/paraglide-sveltekit": "^1.0.0",
-    "@inlang/paraglide-next": "^1.0.0",
-    "@inlang/paraglide-astro": "^1.0.0",
-    "@inlang/paraglide-vite": "^1.0.0",
+    "@inlang/paraglide-js": "^2.0.0",
  }
}
```

### Replace adapter bundler plugins

```diff
// vite.config.js
-import { paraglide } from "@inlang/paraglide-vite";
+import { paraglideVitePlugin } from "@inlang/paraglide-js";


export default defineConfig({
	plugins: [
-		paraglide({
+		paraglideVitePlugin({
			project: "./project.inlang",
			outdir: "./src/paraglide",
		}),
	],
});

````

#### Remove Paraglide Providers

Paraglide JS 2.0 no longer requires providers.

```diff
// app.tsx, layout.svelte, etc.
-import { ParaglideProvider } from "@inlang/paraglide-{framework}";

function App() {
  return (
-    <ParaglideProvider>
      <YourApp />
-    </ParaglideProvider>
  )
}
```

#### Shorten key names longer than 255 characters

Paraglide JS 2.0 build output now defaults to [message-modules](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/compiler-options#outputstructure) to improve tree-shaking. Some filesystem's limitations require key names to be shorter than 255 characters.

Upvote [#423](https://github.com/opral/inlang-paraglide-js/issues/423) to remove this limitation.

```diff
- m.this_is_a_very_long_key_name_that_should_be_shortened()
+ m.shortened_key_name()
```

#### Changing the locale requires a reload

Changing the locale works via `setLocale()` in any framework now.

If you used an adapter in v1 like the SvelteKit one, this behavior is new. The new behaviour leads to a page reload. The reload is a deliberate design decision. Reloading the site eliminates the need for providers, adapters, and API differences between frameworks. Furthermore, optimizations like per-locale splitting is expected to be easier to implement.

Read https://github.com/opral/inlang-paraglide-js/issues/438#issuecomment-2703733096 for more information.

```diff
-<a href="/de">Deutsch</a>
+<button onclick="setLocale('de')">Deutsch</button>
```

#### Lint rules were deprecated

Remove lint rules from your project modules.

We want to re-introduce lint rules in a better form in the future. Please upvote the [#239 lix validation rules](https://github.com/opral/lix-sdk/issues/239) proposal.

```diff
modules: [
-  "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-missing-translation@latest/dist/index.js",
-	 "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-empty-pattern@latest/dist/index.js"
   ...
]

```

#### `localizeHref()` is now required

Some Paraglide adapters used AST transforms to automatically transform `<a>` into localized links. That led to many bugs and edge cases. The AST transforms were removed for v2.

```diff
-<a href="/page"></a>
+<a href={localizeHref("/page")}
```

## 2.0.0-beta.31 (released as 2.0.0)

- feat: New API: `createParaglide()`

  The function allows a no build step or before build step access to Paraglide's compiled APIs.

  ```typescript
  const project = await fs.readFile("./project.inlang");

  const paraglide = await createParaglideModule({
  	project,
  	compilerOptions: {
  		strategy: ["url"],
  	},
  });

  // Use runtime functions
  paraglide.localizeUrl("https://example.com", { locale: "de" });

  // Use server middleware
  app.use(paraglide.paraglideMiddleware());
  ```

- fix: `getLocale` returns correct value on SvelteKit server [#461](https://github.com/opral/inlang-paraglide-js/issues/461)

- fix: Prevent redirect loops by normalizing URLs with trailing slashes [#408](https://github.com/opral/inlang-paraglide-js/issues/408)

- fix: Support for explicit port numbers in URL patterns

- improve: Better error handling in server middleware

## 2.0.0-beta.30

- improve: if no url pattern matches, `localizeUrl()` and `deLocalizeUrl()` will return the input url unchanged instead of throwing an error [#452](https://github.com/opral/inlang-paraglide-js/issues/452#issuecomment-2715761308)

- improve: make AsyncLocalStorage tree-shakable by moving `disableAsyncLocalStorage` into the compiler options [#424](https://github.com/opral/inlang-paraglide-js/issues/424#issuecomment-2711453627)

```diff
-  serverMiddleware(req, resolve, { disableAsyncLocalStorage: true })
+  serverMiddleware(req, resolve)

paraglideVitePlugin({
   // ...
+  disableAsyncLocalStorage: true
})

```

- improve: allow fall through. enables partially localized patterns and thereby eases adoption.

## 2.0.0-beta.29

- fix [#455 setLocale and getLocale call each other in a loop](https://github.com/opral/inlang-paraglide-js/issues/455)

- fix [#454 Adapt config to the new localized param of beta.28](https://github.com/opral/inlang-paraglide-js/issues/454)

## 2.0.0-beta.28

### BREAKING update to the URLPattern API

https://github.com/opral/monorepo/pull/3485

The `localizedNamedGroups` and `deLocalizedNamedGroups` API has been replaced with a tuple-based `localized` array to:

- enable translated pathnames in any combination
- make the API more intuitive

#### Migration Guide:

**Refer to the updated documentation [here](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/strategy#url).**

Before

```json
{
	"pattern": "https://:domain(.*)/:locale(de|fr)?/:path*",
	"deLocalizedNamedGroups": { "locale": null },
	"localizedNamedGroups": {
		"en": { "locale": null },
		"fr": { "locale": "fr" },
		"de": { "locale": "de" }
	}
}
```

After

```json
{
  "pattern": "https://:domain(.*)/:path*",
  "localized": [
    ["fr", "https://:domain(.*)/fr/:path*"],
    ["de", "https://:domain(.*)/de/:path*"]
    ["en", "https://:domain(.*)/:path*"],
  ]
}
```

### other changes

- improve: fallback to `typeof window` in vite [#445](https://github.com/opral/inlang-paraglide-js/issues/445)

- make `setLocale()` set all strategies. Setting all strategies aligns with user expectations and ensures that server APIs can receive the cookie of the client, for example. [#439](https://github.com/opral/inlang-paraglide-js/issues/439)

- new `generateStaticLocalizedUrls()` API [#443](https://github.com/opral/inlang-paraglide-js/issues/433)

```diff
const localizedUrls = generateStaticLocalizedUrls([
  "/example",
  "/page/blog",
  "/123/hello"
])

console.log(localizedUrls.map(url => url.pathnames))
>> /de/example
>> /fr/example
>> ...
```

## 2.0.0-beta.27

- fix wrong matching in API requests [#427](https://github.com/opral/inlang-paraglide-js/issues/427)

Paraglide JS is no longer extracting the locale from API requests for the `url` strategy because that can lead to unwanted re-directs. To get the right locale in API requests, at least add the `baseLocale` strategy to your options.

```diff
-strategy: ["url"]
+strategy: ["url", "cookie", "baseLocale"]
```

- consolidated `message-modules` output into a single file [#434](https://github.com/opral/inlang-paraglide-js/issues/434) to severaly improve scalability

- `experimentalMiddlewareLocaleSplitting` option https://github.com/opral/inlang-paraglide-js/issues/425#issuecomment-2692351073

- fix [setLocale() triggers re-loads if the same locale is set](https://github.com/opral/inlang-paraglide-js/issues/430)

- fix [serverMiddleware() throws when cookie contains invalid locale](https://github.com/opral/inlang-paraglide-js/issues/442)

- add `localStorage` strategy [#431](https://github.com/opral/inlang-paraglide-js/issues/431)

- fix url strategy with optional locale always resoles base locale [#436](https://github.com/opral/inlang-paraglide-js/issues/436)

## 2.0.0-beta.26

- replace `node:crypto` with the Web Crypto API https://github.com/opral/inlang-paraglide-js/issues/424

## 2.0.0-beta.25

- added optional localized groups
- keeps hashes, etc. in the URL when localizing https://github.com/opral/monorepo/pull/3452
- fixes the multi-variant return

## 2.0.0-beta.24

- changes the redirect status from `302` to `307` https://github.com/opral/inlang-paraglide-js/issues/416
- adds a `cleanOutdir` option which defaults to true https://github.com/opral/inlang-paraglide-js/issues/420
- adds a `machine-translate` command if desired on init

## 2.0.0-beta.23

Renames and splits the `serverMiddleware()` into a dedicated `server.js` file to avoid bundler issues.

```diff
- import { serverMiddleware } from "./paraglide/runtime.js";
+ import { paraglideMiddleware } from "./paraglide/server.js";
```

## 2.0.0-beta.22

- fix `serverMiddleware()` only imports async_hooks on the server
- add `serverMiddleware(req, resolve, { disableAsyncLocalStorage: true })` to disable async local storage
- fix `serverMiddleware()` throws in next js when `url` strategy is not used https://github.com/opral/inlang-paraglide-js/issues/411#issuecomment-2683530533

## 2.0.0-beta.21

- compile arbitrary message keys https://github.com/opral/inlang-paraglide-js/issues/201#issuecomment-2680006131
- only polyfills `URLPattern` if needed https://github.com/opral/inlang-paraglide-js/issues/381
- don't include `url` strategy by default https://github.com/opral/inlang-paraglide-js/issues/405
- fixes webpack watch mode https://github.com/opral/inlang-paraglide-js/issues/406

## 2.0.0-beta.20

- automatic re-directs in `serverMiddleware()` https://github.com/opral/inlang-paraglide-js/issues/201#issuecomment-2675823651
- various bug fixes and improvements

## 2.0.0-beta.19

NO MORE ADAPTERS NEEDED.

If you have code from an adapter, remove it and follow the examples in the documentation. https://inlang.com/m/gerre34r/library-inlang-paraglideJs/sveltekit

```diff
-@inlang/paraglide-sveltekit
-@inlang/paraglide-next
-@inlang/paraglide-astro
```

- introduced `serverMiddleware()` https://github.com/opral/inlang-paraglide-js/issues/201#issuecomment-2673375348

- rename `defineGetLocale()` and `defineSetLocale()` to `overwriteGetLocale()` and `overwriteSetLocale()` https://github.com/opral/inlang-paraglide-js/issues/382

- enables `import { m } from "./paraglide/messages.js"` for auto imports https://github.com/opral/inlang-paraglide-js/issues/345

- adds the `strategy` compiler option to the cli https://github.com/opral/inlang-paraglide-js/issues/316

## 2.0.0-beta.18

Added URLPatterns as a replacement for the beta 17 pathnames API.

The URLPattern API is extremly powerful. You can express base paths, translated pathnames, domain based localization, and even multi-tenancy.

Read the docs [here](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/strategy#url) and make PRs to improve the documentation.

```diff
await compile({
-  strategy: ["pathname"],
+  strategy: ["url"],
})
```

The `localizePath()` API had to be replaced by a new `localizeHref()` API. Please give feedback on the new API in [#380](https://github.com/opral/inlang-paraglide-js/issues/380)

```diff
- <a href={localizePath("/about")}>About</a>
+ <a href={localizeHref("/about")}>About</a>
```

## 2.0.0-beta.17

Add support for `pathnames` API https://github.com/opral/inlang-paraglide-js/issues/359

You can now create whatever pathname pattern you want. The syntax is provided by https://github.com/pillarjs/path-to-regexp.

```diff
await compile({
  strategy: ["pathname", "cookie", "baseLocale"],
+ pathnames: {
+   "{*path}": {
+     "de": "/de{/*path}",
+     "en": "/en{/*path}",
}
}
})
```

Add support for `pathnameBase` https://github.com/opral/inlang-paraglide-js/issues/362

```diff
await compile({
  strategy: ["pathname", "cookie", "baseLocale"],
+ pathnameBase: "/base"
})

```

## 2.0.0-beta.16

New `strategy` API. See https://github.com/opral/inlang-paraglide-js/issues/346.

You can now define your own stragegy for getting and setting a locale.

```diff
await compile({
+  strategy: ["pathname", "cookie", "baseLocale"]
})
```

## 2.0.0-beta.14

Fixes windows path normalization https://github.com/opral/monorepo/pull/3374

## 2.0.0-beta.13

- flat compiler options

```diff
await compile({
- compilerOptions: {
-  emitPrettierIgnore: false,
- },
+ emitPrettierIgnore: false,
})
```

- removed `experimentalEmitTs`. the overhead of maintaing two syntaxes is too large https://github.com/opral/inlang-paraglide-js/issues/329

```diff
await compile({
- experimentalEmitTs: true,
})
```

## 2.0.0-beta.11

- improve: compiler awaits ongoing compilations before starting a new one
- update dependency that fixes https://github.com/opral/inlang-paraglide-js/issues/320

## 2.0.0-beta.10

- remove `available` prefix from locale APIs alltogether https://github.com/opral/inlang-paraglide-js/issues/201#issuecomment-2596202820

## 2.0.0-beta.9

- Expose compiler on the index

```diff
-import { compile } from "@inlang/paraglide-js/compiler";
+import { compile } from "@inlang/paraglide-js";
```

- expose paraglide compile args

```diff
+ import { type CompileArgs } from "@inlang/paraglide-js";
```

## 2.0.0-beta.8

- rename `runtime.locales` to `runtime.availableLocales` to align with v1 API and avoid ambiguity https://github.com/opral/inlang-paraglide-js/issues/314
- remove legacy `languageTag` APIs https://github.com/opral/inlang-paraglide-js/issues/315

## 2.0.0-beta.7

- fixed windows path problems
- increased performance of the compiler by removing a redundant setTimeout
- increased performance of the compiler by removing prettier
- `experimentalEmitTs` flag

## 2.0.0-beta.3

### Patch Changes

- remove `fast-glob` as dependency in favor of node's built-in `fs.glob` (a new API in node 22)

## 2.0.0

### Major changes

- Upgrade to @inlang/sdk v2
- Support for variants (pluralization, gendering, A/B test, etc.)

### Minor Changes

- 1d62451: remove `dedent` dependency in CLI
- 5d906bd: refactor: remove posthog-node dependency

  Posthog node has been replaced for a fetch call. Removing 3 (posthog + 2 transitive dependencies).

- 855a71c: adds `experimentalEmitTsDeclarations` compiler option https://github.com/opral/inlang-paraglide-js/issues/288

  ```diff
  await compile({
    // ...
    options: {
  +   experimentalEmitTsDeclarations: true
    }
  })
  ```

  Projects can now select if TypeScript declaration file should be emitted. The need for the `allowJs: true` option in TypeScript configs becomes redundant at the cost of slower compilation times (https://github.com/opral/inlang-paraglide-js/issues/238).

- 346c21b: maintenance: remove path prop from tsconfig

  ```diff
  -"paths": {
  -  "~/*": ["./src/*"]
  -}
  ```

  So not worth it "nice to have" "but it's better DX" thing. Breaks path resolving in JS. Vitest needed a vite config to resolve the paths because only TS knew how to resolve thep paths. Etc. Etc. Etc.

- fb06546: adds `emitGitIgnore` and `emitPrettierIgnore` compiler options

  Closes https://github.com/opral/inlang-paraglide-js/issues/189

  ```diff
  await compile({
    // ...
    options: {
  +   emitPrettierIgnore: false
  +   emitGitIgnore: false
    }
  })
  ```

- e2b9e24: feat: expose compiler as library

  closes https://github.com/opral/inlang-paraglide-js/issues/206

  The Paraglide compiler is now exposed as a library. This allows you to use and extend the compiler however you need.

  ```ts
  import { compile } from "@inlang/paraglide-js/compiler";

  await compile({
  	path: "/path/to/project.inlang",
  	outdir: "/path/to/output",
  });
  ```

- 44ac447: maintenance: remove vite in favor of tsc to build paraglide js lib

  Closes https://github.com/opral/inlang-paraglide-js/issues/208

  ```diff
  -  "build": "vite build",
  +  "build": "tsc",
  ```

  Paraglide JS used vite to build the library. This change removes vite in favor of tsc to build the library. This change is made to simplify the build process and to make it easier to maintain the library in the future.

## 1.11.2

### Patch Changes

- 59c8b11: Fix Ninja recommendation and adoption if working directory is not the repo root

## 1.11.1

### Patch Changes

- 14d80b3: Removed the "Which tech-stack are you using?" prompt from the `init` command as it was not providing any real value. All it did was link you to the appropriate documentation.

  From now on we rely on the docuemntation site to guide people to the correct documenation for their framework.
  - SvelteKit: https://inlang.com/m/dxnzrydw/paraglide-sveltekit-i18n
  - NextJs: https://inlang.com/m/osslbuzt/paraglide-next-i18n
  - Astro: https://inlang.com/m/iljlwzfs/paraglide-astro-i18n
  - SolidStart: https://inlang.com/m/n860p17j/paraglide-solidstart-i18n
  - Vite: https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-vite

## 1.11.0

### Minor Changes

- e37eabf: - renamed packages `@inlang/cross-sell-X` to `@inlang/recommend-X` be more descriptive
  - refactor recommendation view in Sherlock VS Code extension
  - introduce new `shouldRecommend` function to `@inlang/recommend-sherlock` & `@inlang/recommend-ninja`

## 1.10.1

### Patch Changes

- c5d145d: use types from SDK for error handling

## 1.10.0

### Minor Changes

- 33662e6: Gracefully handle errors in the Inlang Project. Only crash on errors that are fatal to paraglide specifically

## 1.9.1

### Patch Changes

- b8573fa: Improved error-reporting

## 1.9.0

### Minor Changes

- eb941fe: Prompt about adding the [Ninja](https://inlang.com/m/3gk8n4n4/app-inlang-ninjaI18nAction) Github Action for translation-linting during `paraglide-js init`. Also exposes it over the internal API.

### Patch Changes

- 9566348: Better handling of `tsconfig` files that `extends` another config.

## 1.8.0

### Minor Changes

- 21ab0a0: Add an output mode where each message is it's own file. This enables treeshaking in less capable bundlers. Currently this is only available via the programmatic API.

### Patch Changes

- 21ab0a0: performance improvements

## 1.7.3

### Patch Changes

- 32cbe48: Improve `bestMatch` reliability

## 1.7.2

### Patch Changes

- 6105a50: No longer log "Exiting the Watcher" when stopping the watching process, as it was causing annoying CMD popups on windows

## 1.7.1

### Patch Changes

- 4d24188: `paraglide-js init` now uses the `createNewProject` API from `@inlang/sdk` for creating new projects. This resulits in higher reliability.

## 1.7.0

### Minor Changes

- 0774c1a: Expose CLI programmatically to enable framework-specific init clis

## 1.6.2

### Patch Changes

- cee4692: Use index accesses instead of `.at` function for better compatability with legacy browsers
- 4b631aa: Update invalid type-declarations
- 3c7a87c: Fixes a race-condition when creating the messages directory during `paraglide-js init`
- ab1fe48: When initialising and a single project is available, it no longer suggests and empty string as the project path

## 1.6.1

### Patch Changes

- fa6aa31: Update internal adapter-utilities
- dee5aa6: Add `--silent` option to `paraglide-js compile` command that will only log errors

## 1.6.0

### Minor Changes

- 462325b: Paraglide now ships with internal utility functions that handle common adapter tasks such as language-negotiation. These aren't public facing, but the version bump is required to make sure adapter-packages resolve the correct version of paragldie.

## 1.5.0

### Minor Changes

- 2428451: `paraglide-js init` now finds more existing projects

## 1.4.0

### Minor Changes

- d47b2aa: Generate empty `messages/{lang}.js` files if no messages are present. This way the "shape" of the generated output is always the same regardless of messages

### Patch Changes

- 192fdec: prompt the user for the `outdir` during `paraglide-js init`
- 0b7c82e: Inline package-version at build time to be more robust

## 1.3.7

### Patch Changes

- 1cc9cbc: Run compiler after `paraglide-js init` so that initial files are present
- 5401f95: Add `--outdir` flag to the generated CLI commands

## 1.3.6

### Patch Changes

- 526b0ba: `paraglide-js init` now prompts for which languages should be supported
- 26d2ba1: No longer add `identical-pattern` lint rule by default

## 1.3.5

### Patch Changes

- 7dce581: fix `openRepository` crash in non-git environments

## 1.3.4

### Patch Changes

- 2a42b6e: bump `@lix-js/client` dependency

## 1.3.3

### Patch Changes

- 11f0e18: Update dependency
- 10e3c28: fix JSDoc annotations on message aliases

## 1.3.2

### Patch Changes

- 45975c0: Fail gracefully if adding `.vscode` folder fails

## 1.3.1

### Patch Changes

- afaaffa: Bundle `@inlang/recommend-sherlock`. This is used to promot _once_ during `paraglide-js init` to ask if you want to install the Sherlock vscode extension

## 1.3.0

### Minor Changes

- 4970afc: paraglide deprecate aliases
- 4837297: File locking for concurrent message updates through the load/store plugin api
  Auto-generated human-IDs and aliases - only with experimental: { aliases: true }

### Patch Changes

- @inlang/recommend-sherlock@0.0.2

## 1.2.9

### Patch Changes

- a99e35fee: use `@inlang/recommend-sherlock` during vscode extension initialization
- Updated dependencies [a99e35fee]
  - @inlang/recommend-sherlock@0.0.2

## 1.2.8

### Patch Changes

- b0f1e908b: Prompt user for tech-stack when running `paraglide-js init` & recommend Adapters

## 1.2.7

### Patch Changes

- f6ec6cdc9: bump `@inlang/sdk` dependency

## 1.2.6

### Patch Changes

- 960f8fb70: rename the vscode extension to "Sherlock"

## 1.2.5

### Patch Changes

- 00f181ad3: fix broken dependency

## 1.2.4

### Patch Changes

- Updated dependencies [244442698]
  - @inlang/language-tag@1.5.0

## 1.2.3

### Patch Changes

- 4c26fa70a: bump dependencies

## 1.2.2

### Patch Changes

- 613ef9877: fix: Bump `@lix-js/client` dependency

## 1.2.1

### Patch Changes

- 74dc1f8c6: Update dependencies
- 4ae6295d0: Detect when `paraglide-js init` is being run inside the VsCode terminal and skip the VsCode question if so
- Updated dependencies [74ac11c47]
  - @inlang/language-tag@1.4.0

## 1.2.0

### Minor Changes

- 0f0e8496d: Throw runtime error if `languageTag()` returns a non-language tag value

## 1.1.1

### Patch Changes

- 7ea9753fb: Improve onboarding message
- 4277232db: fix: better formatting of messageID fallbacks

## 1.1.0

### Minor Changes

- cd29edb11: bumbing fixed env var dependecy issue affected packages

## 1.0.0

Bump Version to 1.0 as no more breaking changes are expected.

## 1.0.0-prerelease.26

Hotfix: Bundle SDK

## 1.0.0-prerelease.25

Update dependencies

## 1.0.0-prerelease.24

feat: Support language Fallbacks according to BCP 47 specification

## 1.0.0-prerelease.23

Update dependencies

## 1.0.0-prerelease.22

Update dependencies

## 1.0.0-prerelease.21

feat: Handle variables that have invalid JS identifiers as names.
fix: Better text escaping in the compiler.
fix: Compiler now fails reliably when a message ID is an invalid JS identifier.

## 1.0.0-prerelease.20

Paraglide now checks if the messages have actually changed before recompiling. This should improve reliability and performance.

## 1.0.0-prerelease.19

fix: Fix inlang/internal#195

## 1.0.0-prerelease.18

`paraglide-js init` now adds `@inlang/message-lint-rule-valid-js-identifier` by default.

## 1.0.0-prerelease.17

`paraglide-js init` now adds `paraglide-js compile` to the postinstall script by default. This sidesteps numerous linting issues when using paraglide in CI environments.

## 1.0.0-prerelease.16

Fix `paraglide-js compile` hanging for a couple seconds after successful compilation

## 1.0.0-prerelease.15

Fix crash when using `npx @inlang/paraglide-js init` and selecting vscode.

## 1.0.0-prerelease.14

Added `--watch` flag to the `paraglide-js compile` command. This will keep the process alive and recompile whenever messages are changed.

```bash
paraglide-js compile --project ./project.inlang --watch
```

## 1.0.0-prerelease.13

`./paraglide/runtime.js` now exports a function called `isAvailableLanguageTag`. This is
the recommended way to check if something is a valid language tag, while maintaining
type safety.

```ts
//Pseudo code
import { isAvailableLanguageTag } from "./paraglide/runtime";

if (isAvailableLanguageTag(params.lang)) {
	return renderSite(params.lang);
} else {
	return 404;
}
```

## 1.0.0-prerelease.12

[Internal Change]
Expose the compiler so that bundler plugins can call it programmatically instead of going through the CLI.

## 1.0.0-prerelease.11

`onSetLanguageTag` no longer throws when called multiple times. Newer callbacks will overwrite old ones.
Developers still should not call `onSetLanguageTag` multiple times, this is needed for HMR to work reliably.

Big thanks to [@KraXen72](https://github.com/KraXen72) for helping us find this bug.

## 1.0.0-prerelease.10

Add an optional options argument to message functions, to allow forcing a languageTag regardless of which languageTag is currently set.

```ts
import * as m from "./paraglide/messages";
const msg = m.hello({ name: "John" }, { languageTag: "de" });
```

## 1.0.0-prerelease.9

The `paraglide-js init` command now uses the [inlang message format](https://inlang.com/m/reootnfj) 2.0 which is human readable.

## 1.0.0-prerelease.8

IMPROVE: Paraglide now splits messages into different resource files as a step towards splitting messages by language via a bundler plugin.

```ts
import * as en from "./paraglide/messages/en";
import * as de from "./paraglide/messages/de";

en.hello();
de.hello();
```

## 1.0.0-prerelease.7

FIX: type error https://github.com/opral/monorepo/pull/1610#issuecomment-1801768825

```diff
export const currentLanguageTag = (params) => {
+	/** @type {Record<string, string>} */
	const variants = {
		en: `The current language tag is "${params.languageTag}".`,
		de: `Der aktuelle Sprachtag ist "${params.languageTag}".`,
	}
	return variants[languageTag()] ?? "currentLanguageTag"
}
```

## 1.0.0-prerelease.6

BREAKING: Paraglide JS now compiles into source code, see https://github.com/opral/monorepo/issues/1607.

What you need to change:

1. Remove `--namespace` from the compile command
2. Replace imports from paraglide to point to the directory in ther source code:

```diff
-import { setLanguageTag, languageTag } from '@inlang/paraglide-js/sveltekit-example';
+import { setLanguageTag, languageTag } from '../../paraglide-js/runtime';
-import * as m from "@inlang/paraglide-js/sveltekit-example/messages"
+import * as m from "../../paraglide-js/messages"
```

## 1.0.0-prerelease.5

improve: `paraglide-js init` now adds the Visual Studio Code extension (Sherlock) if vscode is used

## 1.0.0-prerelease.4

add: `paraglide-js init` command which simplifies the setup process

## 1.0.0-prerelease.3

fix: https://github.com/opral/monorepo/issues/1478

## 1.0.0-prerelease.1

### fix: Jetbrains based editors not detecting `@inlang/paraglide-js/{namespace}/messages` imports

The bug has been fixed by moving `./*/messages` above the less specifc `./*` export.

```json
	"exports": {
		"./*/messages": "./dist/compiled-output/*/messages.js",
		"./*": "./dist/compiled-output/*/runtime.js"
	},
```
