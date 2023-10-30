# Plugin inlang message format

This plugin stores messages in the inlang message format. 

- [x] supports all inlang messages features (variants, markup, etc.)
- [x] the simplest inlang storage plugin (because the messages are stored in the inlang format)
- [x] typesafety for the messages file

# When to use

Use the inlang message format plugin if you have no previous translation files, or you want to migrate to the inlang format for a better experience.

# Settings

```typescript
const PluginSettings = object({
	/**
	 * The path to the JSON file where the messages are stored.
	 *
	 * - Must start with "./".
	 * - Must end with ".json".
	 *
	 * @example "./messages.json"
	 * @example "./src/messages.json"
	 */
	filePath: string([startsWith("./"), endsWith(".json")]),
})
```

# Architecture 

The plugin stores messages as one-to-one mapping in a JSON file. 

**Pros**

- no need to for a parsing or serialization step for messages except for JSON.parse and JSON.stringify
- automatic support for all inlang features and typesafety 

**Cons**

- storing the pattern as AST leads to more disk space usage than storing the pattern as string. a future optimization, if required (!), could store the pattern as a string but would require a parsing and serialization step for each message and a custom message type for typesafety.

---

_Is something unclear or do you have questions? Reach out to us in our [Discord channel](https://discord.gg/9vUg7Rr), open a [Discussion](https://github.com/inlang/monorepo/discussions), or file an [Issue](https://github.com/inlang/monorepo/issues) on [Github](https://github.com/inlang/monorepo)._
