# What does this plugin do?

This plugin stores messages in the inlang message format, and thereby supports all inlang message features. 

# When to use

If you have no existing translation files/you are getting started with translations. 

# Settings

The plugin offers further configuration options that can be passed as arguments. The following settings exist:

```typescript
type PluginSettings = {
	pathPattern: string | { [key: string]: string }
	variableReferencePattern?: [string] | [string, string]
	sourceLanguageFilePath?: string
}
```


---

_Is something unclear or do you have questions? Reach out to us in our [Discord channel](https://discord.gg/9vUg7Rr) or open a [Discussion](https://github.com/inlang/monorepo/discussions) or an [Issue](https:github.com/inlang/monorepong/issues) on [Github](httpgithub.com/inlang/monorepolang)._
