---
title: Configuration
href: /documentation/sdk/configuration
description: TODO write some description
---

# {% $frontmatter.title %}

You can configure the SDK behavior to your needs with the `inlang.config.js` file. This file is located in the root of your project.

## Configuration options

### Local Storage

The default settings store the language in `localStorage` and use the browser language as the default language. You can change this behavior in the `inlang.config.js` file.

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

**Note:** This solution is only suitable for client side rendering or server side rendering with a client side hydration (e.g. Single Page Application (SPA)). If you want to use server side rendering (SSR) or static site generation (SSG), you need to use the `url` or `acceptLanguageHeader` strategy.

### URL & Accept-Language Header

To store the language in the URL and detect the language on the server, you need to add the `url` & `acceptLanguageHeader` strategy to the `languageNegotiation` section in the `inlang.config.js` file. By default, the correct URL is returned. If the language is changed, the correct URL is displayed with the language set in the `<html>` tag of the page. This solution is suitable for server side rendering (SSR) or static site generation (SSG).

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

**Note:** In case you render the page in a static environment, there is no redirct if you try to access the root URL (`/`). You need to redirect to the correct URL yourself. For example, if the default language is `en` and you try to access the root URL, you need to redirect to `/en`.
