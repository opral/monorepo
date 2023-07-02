### The plugin is complicated to set up. We highly encourage alternative i18n library focused plugins like the i18next plugin, typesafe-i18n. See [available plugins](https://inlang.com/documentation/plugins/registry)

# inlang-plugin-json

This plugin reads and writes resources that are stored as JSON. The following features are supported:

- [x] key-value pair (`"key": "value"`)
- [x] nested key-value pairs (`{ "key": { "nested-key": "value" } }`)

<br>

## Usage

```js
// filename: inlang.config.js

export async function defineConfig(env) {
	const { default: jsonPlugin } = await env.$import(
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-json@3/dist/index.js",
	)

	return {
		referenceLanguage: "en",
		plugins: [
			jsonPlugin({
				pathPattern: "./resources/{language}.json",
			}),
		],
	}
}
```

Take a look at the [example inlang.config.js](./example/inlang.config.js) for the plugin config and usage.

<br>

## PluginSettings

Our plugin offers further configuration options that can be passed as arguments. These options include `pathPattern` and `variableReferencePattern` (optional), and can be adjusted to suit your needs.

Here is the syntax for the PluginSettings object in TypeScript:

```typescript
type PluginSettings = {
	pathPattern: string
	variableReferencePattern?: [string, string]
}
```

### `pathPattern`

To use our plugin, you need to provide a path to the directory where your language-specific files are stored. Use the dynamic path syntax `{language}` to specify the language name. Note that subfile structures are not supported.

**Type definition**

```typescript
pathPattern: string
```

**Example**

```typescript
pathPattern: "./resources/{language}.json"
```

### `variableReferencePattern`

This setting in our plugin allows you to specify the pattern for parsing placeholders for code variables in strings. To define the parsing pattern, add `variableReferencePattern` to the jsonPlugin in your `inlang.config.js` file.

The `variableReferencePattern` should be defined as a tuple that includes a prefix and a suffix pattern. These patterns create a dynamic regex under the hood to catch placeholders out of the string. If your pattern is something like this `:name`, you can provide only the prefix.

Here is the type definition for `variableReferencePattern` in TypeScript:

**Type definition**

```typescript
 variableReferencePattern?: [string, string];
```

**Example**

```typescript
jsonPlugin({
	pathPattern: "somePath",
	variableReferencePattern: ["{", "}"],
})
```

**Common use cases**

| Placeholder       | Pattern        |
| ----------------- | -------------- |
| `{placeholder}`   | `["{", "}"]`   |
| `{{placeholder}}` | `["{{", "}}"]` |
| `${placeholder}`  | `["${", "}"]`  |
| `%placeholder`    | `["%"]`        |
| `[placeholder]`   | `["[", "]"]`   |
| `:placeholder`    | `[":"]`        |

<br>

## Limitations

If a user creates a message with a nested id i.e. `example.nested` and `example` is also a message, the plugin will break.
