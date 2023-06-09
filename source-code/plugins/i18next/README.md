# inlang-plugin-i18next

This plugin reads and writes resources in combination with i18next.

## Usage

```js
// filename: inlang.config.js

export async function defineConfig(env) {
	const { default: i18nextPlugin } = await env.$import(
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@2/dist/index.js",
	)

	return {
		referenceLanguage: "en",
		plugins: [
			i18nextPlugin({
				pathPattern: "./resources/{language}.json",
			}),
		],
	}
}
```

## Settings

The plugin offers further configuration options that can be passed as arguments. The following settings exist:

```typescript
type PluginSettings = {
	pathPattern: string
}
```

### `pathPattern`

To use our plugin, you need to provide a path to the directory where your language-specific files are stored. Use the dynamic path syntax `{language}` to specify the language name. Note that subfile structures are not supported.

**Most common for i18next with namespace support:**

```typescript
pathPattern: "./resources/{language}/*.json"
```

**Only one namespace:**

```typescript
pathPattern: "./resources/{language}/translation.json"
```

**Language as file name:**

```typescript
pathPattern: "./resources/{language}.json"
```

## Contributing

### Getting started

Run the following commands in your terminal (node and npm must be installed):

1. `npm install`
2. `npm run dev`

`npm run dev` will start the development environment which automatically compiles the [src/index.ts](./src/index.ts) files to JavaScript ([dist/index.js](dist/index.js)), runs tests defined in `*.test.ts` files and watches changes.

### Publishing

Run `npm run build` to generate a build.

The [dist](./dist/) directory is used to distribute the plugin directly via CDN like [jsDelivr](https://www.jsdelivr.com/). Using a CDN works because the inlang config uses dynamic imports to import plugins.

Read the [jsDelivr documentation](https://www.jsdelivr.com/?docs=gh) on importing from GitHub.
