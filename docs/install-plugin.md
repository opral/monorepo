---
og:title: "Installing Plugins"
og:description: "How to install and configure inlang plugins via CDN or npm."
---

# Installing Plugins

Plugins enable inlang to work with different i18n file formats. This guide shows how to install and configure plugins.

## Adding a plugin

Add the plugin URL to the `modules` array in `project.inlang/settings.json`:

```diff
{
  "baseLocale": "en",
  "locales": ["en", "de", "fr"],
+ "modules": [
+   "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@3/dist/index.js"
+ ]
}
```

Plugins are loaded from the URL when the project opens.

### Why jsdelivr?

Plugins are loaded via [jsdelivr](https://www.jsdelivr.com/), a free CDN for npm packages. This provides:

- **Fast loading** — CDN edge caching worldwide
- **Version pinning** — Lock to specific versions for reproducible builds

Version pinning examples:

```
@inlang/plugin-i18next@3        # Major version (3.x.x)
@inlang/plugin-i18next@3.5      # Minor version (3.5.x)
@inlang/plugin-i18next@3.5.2    # Exact version
```

Pin to at least a major version to avoid breaking changes.

## Configuring a plugin

Most plugins require configuration. Add settings using the `plugin.<plugin-id>` key:

```json
{
  "baseLocale": "en",
  "locales": ["en", "de", "fr"],
  "modules": [
    "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@3/dist/index.js"
  ],
  "plugin.inlang.i18next": {
    "pathPattern": "./locales/{locale}.json"
  }
}
```

Each plugin documents its available settings on its marketplace page.

## Using multiple plugins

You can install multiple plugins. Each plugin handles different files or provides different functionality:

```json
{
  "baseLocale": "en",
  "locales": ["en", "de"],
  "modules": [
    "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@3/dist/index.js",
    "https://cdn.jsdelivr.net/npm/@inlang/plugin-t-function-matcher@3/dist/index.js"
  ],
  "plugin.inlang.i18next": {
    "pathPattern": "./locales/{locale}.json"
  }
}
```

In this example:

- `plugin-i18next` imports/exports translation files
- `plugin-t-function-matcher` detects `t()` function calls in source code

## Local plugins

Plugins can also be loaded from local files using relative paths.

### From node_modules

Install a plugin via npm:

```bash
npm install @inlang/plugin-i18next
```

Then reference it from `node_modules`:

```json
{
  "modules": ["../node_modules/@inlang/plugin-i18next/dist/index.js"]
}
```

The path is relative to the `project.inlang` directory.

### Custom plugins

For your own plugins, point to the built file:

```json
{
  "modules": ["./plugins/my-plugin.js"]
}
```

## Remote vs local plugins

|                       | Remote (CDN)                    | Local (node_modules)            |
| --------------------- | ------------------------------- | ------------------------------- |
| **Portability**       | Works everywhere                | Requires `npm install`          |
| **App compatibility** | Works with Fink, Sherlock, etc. | Not resolvable by external apps |
| **Offline usage**     | Requires internet on first load | Works offline after install     |
| **Version pinning**   | Version in URL                  | Version in package.json         |

**Recommendation:** Use remote plugins via jsdelivr for maximum compatibility. External apps like Fink cannot resolve `node_modules` paths, so local plugins will only work in your local development environment.

## Finding plugins

Browse available plugins at [inlang.com/c/plugins](https://inlang.com/c/plugins).

## Troubleshooting

**Plugin not loading**

- Verify the URL is correct and ends with `.js`
- Check that the CDN is accessible
- For local plugins, ensure the path is relative to `project.inlang`

**Files not importing**

- Check that `pathPattern` matches your file structure
- Verify `{locale}` placeholder is in the correct position
- Ensure locale codes in filenames match your `locales` array

**Settings validation errors**

- Review the plugin's documentation for required settings
- Check that setting values match expected types

## Next steps

- [Settings Reference](/docs/settings) — All configuration options
- [Writing a Plugin](/docs/write-plugin) — Create your own plugin
- [Plugin API](/docs/plugin-api) — Plugin interface reference
