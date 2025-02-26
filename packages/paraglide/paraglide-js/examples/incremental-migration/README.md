---
imports:
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-callout.js
---

# Incremental migration

Paraglide JS can load any [translation file formats](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/file-formats). As such, you can incrementally migrate to Paraglide JS. 

- Continue using your existing translation files
- Mix and match different formats (JSON, i18next, etc.)
- Migrate your codebase piece by piece

<doc-callout type="info">
  This example uses i18next translation files but is applicable to any format.
</doc-callout>

## Add the i18next plugin

Find a list of available plugins [here](https://inlang.com/c/plugins). For this example, the i18next plugin is used. Update the `project.inlang` settings to include the i18next plugin:

```diff
{
  "baseLocale": "en",
  "locales": ["en", "de", "fr"],
  "modules": [
    "https://cdn.jsdelivr.net/npm/@inlang/message-format-plugin@latest/dist/index.js",
+    "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@latest/dist/index.js"
  ],
+  "plugin.inlang.i18next": {
+    "pathPattern": "./locales/{locale}.json"
+  }
}
```

### Using i18n libraries together

Now you can use both i18next and Paraglide JS in your code:

```js
// Existing i18next code
import i18next from 'i18next';
import { m } from './paraglide/messages.js';

console.log(i18next.t('greeting', { name: 'World' }));
console.log(m.greeting({ name: 'World' }));
```