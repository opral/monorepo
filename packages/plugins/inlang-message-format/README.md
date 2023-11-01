# Plugin inlang message format

This plugin stores messages in the inlang message format. 

- [x] supports all inlang messages features (variants, markup, etc.)
- [x] typesafe

# When to use

**The message format is optimized to be edited with the [ide-xtension](https://inlang.com/m/r7kp499g/app-inlang-ideExtension)**

Use the inlang message format plugin if you have no previous translation files, or you want to migrate to the inlang format for a better experience. If you want to edit messages manually, the [JSON translation files plugin](https://inlang.com/m/ig84ng0o) is a better choice.

# Settings

`filePath`: The path where the messages are stored.

# Architecture 

The plugin stores messages as one-to-one mapping in a JSON file. 

**Pros**

- no need to for a parsing or serialization step for messages except for JSON.parse and JSON.stringify
- automatic support for all inlang features and typesafety 

**Cons**

- storing the pattern as AST leads to more disk space usage than storing the pattern as string. a future optimization, if required (!), could store the pattern as a string but would require a parsing and serialization step for each message and a custom message type for typesafety.

---

_Is something unclear or do you have questions? Reach out to us in our [Discord channel](https://discord.gg/9vUg7Rr), open a [Discussion](https://github.com/inlang/monorepo/discussions), or file an [Issue](https://github.com/inlang/monorepo/issues) on [Github](https://github.com/inlang/monorepo)._
