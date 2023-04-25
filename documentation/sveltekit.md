---
title: SDK for SvelteKit
href: /documentation/sveltekit
description: i18n SDK designed and fully integrated for SvelteKit.
---

{% Figure

    src="https://user-images.githubusercontent.com/11630812/114088279-7cd7be80-98d2-11eb-883c-66c3bf48f293.png"

    alt="SvelteKit Header"

/%}

# {% $frontmatter.title %}

## What does the SDK provide?

- automatic language specific routing (e.g. `/en/site`, `/de/site`)
- faster page loads (resource splitting per route)
- fully integrated (compiler-based to avoid a heavy runtime)
- typesafety (due to compiler)
- better SEO (localized head tags and sitemaps)
- automatic setup for inlang editor and VS Code extension

## Getting Started

1. Add `@inlang/sdk-js/adapter-sveltekit` dependency to your project

   ```js
   // using npm
   npm install -D @inlang/sdk-js/adapter-sveltekit

   // using yarn
   yarn add -D @inlang/sdk-js/adapter-sveltekit
   ```

2. Add the inlang plugin to the `plugins` section of `vite.config.js`

   ```js
   import { inlangPlugin } from "@inlang/sdk-js/adapter-sveltekit"

   export default defineConfig({
   	plugins: [sveltekit(), inlangPlugin.vite()],
   })
   ```

3. Add the inlang preprocess to the `preprocess` section of `svelte.config.js`

   ```js
   import { inlangPreprocess } from "@inlang/sdk-js/adapter-sveltekit"

   const config = {
   	preprocess: [inlangPreprocess()],
   }
   ```

**Note:** Make shure you have your translation files in the `~/languages` folder in the root directory. The files should be named after the language code (e.g. `en.json`, `de.json`).

## Usage Example

```js
<script>
  import { i, languages, switchLanguage } from '@inlang/sdk-js'
</script>

// buttons to switch languages
{#each languages as lang}
  <button> on:click={() => switchLanguage(lang)}>{lang}</button>
{/each}

// language dependent text
<h1>{i('welcome')}</h1>
```

### Single Page Application (SPA)

The default settings save the language in the `localStorage` and use the browser language as the default language. You can change this behavior in the `inlang.config.js` file.

```js
export async function defineConfig(env) {
	return {
		sdk: {
			languageNegotiation: {
				strategies: [{ type: "localStorage" }, { type: "navigator" }],
			},
		},
	}
}
```

### Server Side Rendering (SSR)

To store the language in the URL and detect the language on the server, you need to add the `url` & `acceptLanguageHeader` strategy to the `languageNegotiation` section in the `inlang.config.js` file. By default, the correct URL is returned. If the language is changed, the correct URL is displayed with the language set in the `<html>` tag of the page.

```js
export async function defineConfig(env) {
	return {
		sdk: {
			languageNegotiation: {
				strategies: [{ type: "url" }, { type: "acceptLanguageHeader" }],
			},
		},
	}
}
```

### Static Site Generation (SSG)

For static site generation, you need to add the `url` & `acceptLanguageHeader` strategy to the `languageNegotiation` section in the `inlang.config.js` file. This will generate a static site for each language and the language is set in the `<html>` tag of the page. By default javascript detects the browser language and redirects to the correct URL. As the server can't be used in a static environment, there is no redirct if you try to access the root URL (`/`).

```js
export async function defineConfig(env) {
	return {
		sdk: {
			languageNegotiation: {
				strategies: [{ type: "url" }, { type: "acceptLanguageHeader" }],
			},
		},
	}
}
```

**Note:** The SvelteKit adapter for static sites is required. See instructions below.

Install with `npm i -D @sveltejs/adapter-static`, then add the adapter to your `svelte.config.js`:

```js
import adapter from "@sveltejs/adapter-static"

export default {
	kit: {
		adapter: adapter({
			// default options are shown. On some platforms
			// these options are set automatically
			pages: "build",
			assets: "build",
			fallback: null,
			precompress: false,
			strict: true,
		}),
	},
}
```

See [SvelteKit Adapter](https://kit.svelte.dev/docs/adapter-static) for more information.
