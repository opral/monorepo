---
title: Getting started
href: /documentation/getting-started
description: Learn on how to get started with inlang.
---

# {% $frontmatter.title %}

One single config file named `inlang.config.js` needs to be created at the root of the repository.

If you don't use JSON in your project, check out all the other [plugins](https://github.com/inlang/ecosystem) we support.

## Step-by-step for JSON files

1. Create a new file named `inlang.config.js` in the root of your git repository.
   Example:
   {% Figure
   width="w-3/4"

   src="https://user-images.githubusercontent.com/72493222/222404451-9e5cf370-5ff1-4e12-939e-135687423e70.png"

   alt="inlang config example"

/%}

1. Copie/paste the code below in the config and change the `pathPattern` into your directory structure.

   ```js
   // filename: inlang.config.js

   export async function defineConfig(env) {
   	// importing the json plugin
   	const plugin = await env.$import(
   		"https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@1/dist/index.js",
   	)

   	const pluginConfig = {
   		pathPattern: ".example/{language}.json",
   	}

   	return {
   		referenceLanguage: "en",
   		languages: await plugin.getLanguages({
   			...env,
   			pluginConfig,
   		}),
   		readResources: (args) => plugin.readResources({ ...args, ...env, pluginConfig }),
   		writeResources: (args) => plugin.writeResources({ ...args, ...env, pluginConfig }),
   	}
   }
   ```

2. Commit the config and open your project in the [inlang editor](https://inlang.com/editor)

## Configure `ide-extension`

Within the object your configuration returns the `ideExtension` configures the `ide-extension`.

```js
// filename: inlang.config.js

export async function defineConfig(env) {
	// ...
	return {
		// ...
		ideExtension: {
			messageReferenceMatchers: [
				async (args) => {
					const regex = /(?<!\w){?t\(['"](?<messageId>\S+)['"]\)}?/gm
					const str = args.documentText
					let match
					const result = []

					while ((match = regex.exec(str)) !== null) {
						const startLine = (str.slice(0, Math.max(0, match.index)).match(/\n/g) || []).length + 1
						const startPos = match.index - str.lastIndexOf("\n", match.index - 1)
						const endPos =
							match.index +
							match[0].length -
							str.lastIndexOf("\n", match.index + match[0].length - 1)
						const endLine =
							(str.slice(0, Math.max(0, match.index + match[0].length)).match(/\n/g) || []).length +
							1

						if (match.groups && "messageId" in match.groups) {
							result.push({
								messageId: match.groups["messageId"],
								position: {
									start: {
										line: startLine,
										character: startPos,
									},
									end: {
										line: endLine,
										character: endPos,
									},
								},
							})
						}
					}
					return result
				},
			],
			extractMessageOptions: [
				{
					callback: (messageId) => `{t("${messageId}")}`,
				},
				{
					callback: (messageId) => `t("${messageId}")`,
				},
			],
		},
	}
}
```

## Adding typesafety to the config

{% Callout variant="info" %}

Your codebase must use, or be able to use, `moduleResolution: "node16"`. Read [#298](https://github.com/inlang/inlang/issues/298) for more information.

{% /Callout %}

If inlang is used in a JavaScript environment like Node or Deno, typesafety can be achieved by installing [@inlang/core](https://www.npmjs.com/package/@inlang/core) and using [JSDoc](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html) in JavaScript.

1. Install `@inlang/core` as dev dependency.

```bash
$ npm install @inlang/core --save-dev
```

2. Add the following JSDoc comment above the `defineConfig` function.

   ```js
   /**
    * @type {import("@inlang/core/config").DefineConfig}
    */
   export async function defineConfig(env) {
   	//
   	//
   	//
   }
   ```

3. Add `checkJs: true` and `moduleResolution: node16` to your `tsconfig.json`.

   ```js
   compilerOptions: {
   	// ...
   	checkJs: true
   	moduleResolution: "node16"
   }
   ```
