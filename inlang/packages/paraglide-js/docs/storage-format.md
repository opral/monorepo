---
imports: 
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-callout.js
---


# Storage

<doc-callout type="info">
  Paraglide JS utilizes the inlang SDK, which is responsible for handling the storage of messages. 
</doc-callout>

You can use any inlang plugin to store messages. 

By default, Paraglide JS uses the [inlang-message-format](https://inlang.com/m/reootnfj/plugin-inlang-messageFormat) plugin. But, you can use any other plugin that suits your needs. Mixing & matching is also possible.

## Explore storage plugins

All plugins can be found on https://inlang.com/c/plugins. Here are some popular plugins:

- [Inlang Message Format](https://inlang.com/m/reootnfj/plugin-inlang-messageFormat)
- [JSON](https://inlang.com/m/7zjzqj7n/plugin-inlang-json)
- [i18next](https://inlang.com/m/3i8bor92/plugin-inlang-i18next)

## Installing a storage plugin

Add the link of the plugin to the `modules` in the `settings.json` file. 

<doc-callout type="info">
  Refer to the documentation of the plugin for the link and installation guide.
</doc-callout>

```diff
{
  "baseLocale": "en",
  "locales": ["en", "de"],
  "modules": [
     "other plugins...",
+    "https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@latest/dist/index.js"    
  ]
}
```

## Using multiple storage plugins

You can use multiple storage plugins in your project. 

```diff
{
  "baseLocale": "en",
  "locales": ["en", "de"],
  "modules": [
     "other plugins...",
+     "https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@latest/dist/index.js"
+     "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@latest/dist/index.js"
  ]
}
```