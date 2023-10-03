# Plugin inlang message format

This plugin stores messages in the inlang message format. 

- [x] supports all inlang messages features (variants, markup, etc.)
- [x] the simplest and best inlang storage plugin (because it stores messages in the inlang format) 

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
	storagePath: string([startsWith("./"), endsWith(".json")]),
})
```


---

_Is something unclear or do you have questions? Reach out to us in our [Discord channel](https://discord.gg/9vUg7Rr), open a [Discussion](https://github.com/inlang/monorepo/discussions), or file an [Issue](https:github.com/inlang/monorepong/issues) on [Github](httpgithub.com/inlang/monorepolang)._
