---
title: Configuration Options for the inlang SDK
shortTitle: Configuration
href: /documentation/sdk/configuration
description: Configure the inlang SDK to your needs.
---

# {% $frontmatter.shortTitle %} Options

You can configure the SDK behavior to your needs with the `inlang.config.js` file. This file is located in the root of your project. Just add the `sdkPlugin` and configure it to your project's needs.

If you don't have a `inlang.config.js` file yet, you can create one by following our [Quickstart-Guide](/documentation/quick-start).

```js
/**
 * @type { import("@inlang/core/config").DefineConfig }
 */
export async function defineConfig(env) {
	const { default: sdkPlugin } = await env.$import(
		"https://cdn.jsdelivr.net/npm/@inlang/sdk-js-plugin/dist/index.js",
	)

	return {
		sourceLanguageTag: "en",
		plugins: [
			// ... other plugins e.g. to read and write Resources
			// see https://github.com/inlang/ecosystem#resources
			sdkPlugin({
				languageNegotiation: {
					strategies: [{ type: "localStorage" }],
				},
			}),
		],
	}
}
```

> There are limited configuration options for now. We will add more options in the coming weeks.

## languageNegotiation

The `languageNegotiation` property makes it possible to customize the behavior how you application detects the language of the user.

## strategies

You can choose between different strategies to detect the language of the user. You can specify multiple strategies. The first strategy that returns a language will be used.

- localStorage

Detects if the `language` key is set in the localStorage and uses it as the language for the application.

```js
{
	strategies: [
		{ type: "localStorage" },
	],
},
```

- url

Detects the `language` by looking at the first segment of the url e.g. `/en/about`

```js
{
	strategies: [
		{ type: "url" },
	],
},
```

## resources

The `resources` property defines how to deal with resources read with the resolved `inlang.config.js`.

- cache

Defines how to cache resources.

> Right now we only support static Resources. Please open an [Issue](https://github.com/inlang/inlang/issues) if you need to regularly fetch Resources.

- build-time (default)

Loads all Resources during build time and adds them to the bundle.

```js
{
	resources: {
		cache: "build-time"
	},
},
```

## routing

### exclude

You can tell `inlang` to ignore certain routes in your project. Those routes will have no i18n code setup, so accessing any `@inlang/sdk-js` imports inside those routes could fail during runtime.

```js
{
	routing: {
		exclude: [
			"/api",
			"/login",
		],
	},
},
```

- All entries must be defined as a relative path `/`.
- If `/api` get's specified, all subpaths (e.g. `/api/users`) will also match (`startsWith`).

---

_Is something unclear or do you have questions? Reach out to us in our [Discord channel](https://discord.gg/9vUg7Rr) or open a [Discussion](https://github.com/inlang/inlang/discussions) or an [Issue](https://github.com/inlang/inlang/issues) on [Github](https://github.com/inlang/inlang)._
