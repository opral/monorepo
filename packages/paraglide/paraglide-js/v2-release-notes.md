# Paraglide JS 2.0 🚀

Paraglide JS 2.0 had three main goals:

1. Use the new inlang SDK v2 which supports variants [#201](https://github.com/opral/inlang-paraglide-js/issues/201).
2. Unify the API across any framework [#217](https://github.com/opral/inlang-paraglide-js/issues/217).
3. Support any i18n strategy (cookie, url, domain, session, etc).

I am happy to announce that all three goals have been achieved!

- **Variants are now supported** [docs](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/variants)
- **No more adapters or providers are needed** (!)
- **Any strategy is now supported** [docs](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/strategy)

In addition, Paraglide JS 2.0 comes with several DX improvements:

- **Nested message keys** are now supported (most requested feature!)
- **Auto-imports** when writing `m.` (no more manual `import * as m`)
- **Arbitrary key names** including emojis via `m["🍌"]()`

## New features

### No more adapters are needed

```diff
- @inlang/paraglide-sveltekit
- @inlang/paraglide-next
+ // No more adapters are needed
```

### 🚀 Framework-Agnostic Server Middleware

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

### 🛣️ Configurable Routing Strategies

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

### 🔧 Exposing the compiler API

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

### 🍌 Arbitrary key names

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

### 🔄 Incrementally migrating to Paraglide JS

Paraglide JS 2.0 can load multiple [translation file formats](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/file-formats). As such, you can incrementally migrate to Paraglide JS with existing translation file formats.

```js
// In this example, Paraglide JS compiles i18next translation files
// which enables using both i18next and Paraglide JS.

import i18next from "i18next";
import { m } from "./paraglide/messages.js";

console.log(i18next.t("greeting", { name: "World" }));
console.log(m.greeting({ name: "World" }));
```

## 🏘️ Multi-tenancy support

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

## Migrating breaking changes

If problems arise, please refer to the framework-specific getting started guide:

- [SvelteKit](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/sveltekit)
- [Next.js](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/next)
- [Astro](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/astro)
- [Vite](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/vite)
- [React Router](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/react-router)

### `LanguageTag` got renamed to `locale`

To align with industry standards, we renamed `LanguageTag` to `locale`.

```diff
-languageTag()
+getLocale()
-setLanguageTag()
+setLocale()
-availableLanguageTags
+locales
```

### Remove adapters `@inlang/paraglide-*` from your dependencies

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

### Remove Paraglide Providers

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

### Shorten key names longer than 255 characters

Paraglide JS 2.0 build output now defaults to [message-modules](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/compiler-options#outputstructure) to improve tree-shaking. Some filesystem's limitations require key names to be shorter than 255 characters.

Upvote [#423](https://github.com/opral/inlang-paraglide-js/issues/423) to remove this limitation. 

```diff
- m.this_is_a_very_long_key_name_that_should_be_shortened()
+ m.shortened_key_name()
```

### Changing the locale requires a reload

Changing the locale works via `setLocale()` in any framework now. 

If you used an adapter in v1 like the SvelteKit one, this behavior is new. The new behaviour leads to a page reload. The reload is a deliberate design decision. Reloading the site eliminates the need for providers, adapters, and API differences between frameworks. Furthermore, optimizations like per-locale splitting is expected to be easier to implement. 

Read https://github.com/opral/inlang-paraglide-js/issues/438#issuecomment-2703733096 for more information.

```diff
-<a href="/de">Deutsch</a>
+<button onclick="setLocale('de')">Deutsch</button>
```