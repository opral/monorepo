---
og:title: "Settings Reference"
og:description: "Reference documentation for inlang project settings configuration."
---

# Settings Reference

Project settings are defined in `project.inlang/settings.json`. This document covers all available settings.

## Core Settings

```typescript
type ProjectSettings = {
  $schema?: string;
  baseLocale: string;
  locales: string[];
  modules?: string[];
  telemetry?: "off";
  experimental?: Record<string, true>;
}
```

### baseLocale

**Required.** The base locale of your project. All other translations are derived from this locale.

```json
{
  "baseLocale": "en"
}
```

Must be a valid [BCP-47 language tag](https://www.w3.org/International/articles/language-tags/).

### locales

**Required.** All locales available in your project, including the base locale.

```json
{
  "baseLocale": "en",
  "locales": ["en", "de", "fr", "es"]
}
```

- Must include `baseLocale`
- Each locale must be a valid BCP-47 language tag
- Duplicates are not allowed

### modules

URIs to plugin modules. Plugins extend inlang with import/export capabilities for different i18n formats.

```json
{
  "modules": [
    "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@3/dist/index.js",
    "./local-plugin.js"
  ]
}
```

- Must be valid URIs (RFC 3986)
- Must end with `.js`
- Can be absolute (CDN) or relative paths

### telemetry

Controls anonymous usage telemetry. Omit for default behavior, or set to `"off"` to disable.

```json
{
  "telemetry": "off"
}
```

### experimental

Enable experimental features. Keys are feature names, values must be `true`.

```json
{
  "experimental": {
    "newFeature": true
  }
}
```

## Plugin Settings

Plugins define their own settings schemas. Plugin settings use the prefix `plugin.<plugin-id>`.

```json
{
  "plugin.inlang.i18next": {
    "pathPattern": "./locales/{locale}.json"
  }
}
```

See each plugin's marketplace page for available settings.

## Example

```json
{
  "$schema": "https://inlang.com/schema/project-settings",
  "baseLocale": "en",
  "locales": ["en", "de", "fr", "es"],
  "modules": [
    "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@3/dist/index.js",
    "https://cdn.jsdelivr.net/npm/@inlang/plugin-t-function-matcher@3/dist/index.js"
  ],
  "plugin.inlang.i18next": {
    "pathPattern": {
      "common": "./locales/{locale}/common.json",
      "errors": "./locales/{locale}/errors.json"
    },
    "variableReferencePattern": ["{{", "}}"]
  }
}
```

## Deprecated Settings

These settings are deprecated and will be removed in SDK v3:

| Setting | Replacement |
|---------|-------------|
| `sourceLanguageTag` | Use `baseLocale` |
| `languageTags` | Use `locales` |
| `{languageTag}` in paths | Use `{locale}` |

## Next Steps

- [Getting Started](/docs/getting-started) — Set up your first project
- [Plugin API](/docs/plugin-api) — Build custom plugins
- [Architecture](/docs/architecture) — Understand the system design
