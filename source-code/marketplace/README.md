# inlang Marketplace

inlang's Marketplace provides you with apps, plugins and lint rules for your next project. You can use the filter options to find the right item for your project.

## How to publish to the Marketplace

If you have created a plugin or lint rule, you can publish it to the Marketplace in three easy steps:

### 1️⃣ Add the necessary meta information to your `plugin or lint-rule file`

The marketplace needs some more information than necessary for the plugin to work.

How your meta information should look like can be seen in the following example:

```ts
meta: {
        // ...
		marketplace: {
			icon: "https://link-to-your-icon.com/icon.png",
			linkToReadme: {
				en: "https://link-to-your-readme.com/en",
			},
			keywords: ["keywords", "for", "your", "plugin"],
			publisherName: "@your-username",
			publisherIcon: "https://link-to-your-icon.com/icon.png",
		},
	},
```

### 2️⃣ Add the link to your `plugin or lint-rule file` to the registry.json array under `modules``

```json
{
	"modules": [
		// ...
		"https://link-to-your-plugin-or-lint-rule.com/plugin-or-lint-rule.js"
	]
}
```

### 3️⃣ Create a pull request and wait for approval

Create a pull request with your changes and wait for approval. After that, your plugin or lint rule will be available in the marketplace.
