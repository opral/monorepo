# Writing a Plugin

This guide walks through creating a plugin from scratch. By the end, you'll have a working plugin that imports and exports a custom JSON format.

## What plugins do

Plugins transform between external file formats and inlang's internal data model:

```
Translation files  ──►  importFiles()  ──►  Bundles/Messages/Variants
                                                     │
                                                     ▼
                                               .inlang database
                                                     │
                                                     ▼
Translation files  ◄──  exportFiles()  ◄──  Bundles/Messages/Variants
```

## Step 1: Create the plugin file

Create a new file for your plugin:

```typescript
// my-plugin.ts
import type { InlangPlugin } from "@inlang/sdk";

export const plugin: InlangPlugin = {
  key: "plugin.my.json",
};
```

The `key` uniquely identifies your plugin. Use a namespaced format like `plugin.company.format`.

## Step 2: Define which files to import

Implement `toBeImportedFiles` to tell inlang which files your plugin handles:

```typescript
export const plugin: InlangPlugin = {
  key: "plugin.my.json",

  toBeImportedFiles: async ({ settings }) => {
    // Return one file per locale
    return settings.locales.map((locale) => ({
      path: `./messages/${locale}.json`,
      locale,
    }));
  },
};
```

This tells inlang: "For each locale in the project, there's a JSON file at `./messages/{locale}.json`."

## Step 3: Parse files into the data model

Implement `importFiles` to parse your file format:

```typescript
export const plugin: InlangPlugin = {
  key: "plugin.my.json",

  toBeImportedFiles: async ({ settings }) => {
    return settings.locales.map((locale) => ({
      path: `./messages/${locale}.json`,
      locale,
    }));
  },

  importFiles: async ({ files }) => {
    const bundles = [];
    const messages = [];
    const variants = [];

    for (const file of files) {
      // Parse the JSON file
      const json = JSON.parse(new TextDecoder().decode(file.content));

      // Convert each key-value pair to the data model
      for (const [key, value] of Object.entries(json)) {
        // One bundle per translation key
        bundles.push({
          id: key,
          declarations: [],
        });

        // One message per locale
        messages.push({
          bundleId: key,
          locale: file.locale,
          selectors: [],
        });

        // One variant with the actual text
        variants.push({
          messageBundleId: key,
          messageLocale: file.locale,
          matches: [],
          pattern: [{ type: "text", value: value as string }],
        });
      }
    }

    return { bundles, messages, variants };
  },
};
```

### Understanding the data model

- **Bundle** — A translation key (e.g., `"greeting"`). Groups all locale versions.
- **Message** — One locale's version of a bundle. Links bundle + locale.
- **Variant** — The actual text. Most messages have one variant; plurals have multiple.

For a simple `{ "greeting": "Hello" }`:
```
Bundle: id="greeting"
└── Message: bundleId="greeting", locale="en"
    └── Variant: pattern=[{ type: "text", value: "Hello" }]
```

## Step 4: Export back to files

Implement `exportFiles` to write changes back:

```typescript
exportFiles: async ({ bundles, messages, variants }) => {
  // Group messages by locale
  const filesByLocale: Record<string, Record<string, string>> = {};

  for (const message of messages) {
    // Find the variant for this message
    const variant = variants.find((v) => v.messageId === message.id);

    // Extract text from the pattern
    const text = variant?.pattern
      .filter((p) => p.type === "text")
      .map((p) => p.value)
      .join("") ?? "";

    // Add to the locale's file
    if (!filesByLocale[message.locale]) {
      filesByLocale[message.locale] = {};
    }
    filesByLocale[message.locale][message.bundleId] = text;
  }

  // Convert to export format
  return Object.entries(filesByLocale).map(([locale, content]) => ({
    locale,
    name: `${locale}.json`,
    content: new TextEncoder().encode(JSON.stringify(content, null, 2)),
  }));
},
```

## Step 5: Add settings (optional)

Let users configure your plugin with a settings schema:

```typescript
import { Type } from "@sinclair/typebox";

const PluginSettings = Type.Object({
  pathPattern: Type.String({
    description: "Path pattern for translation files",
    examples: ["./messages/{locale}.json"],
  }),
});

export const plugin: InlangPlugin<{
  "plugin.my.json": typeof PluginSettings;
}> = {
  key: "plugin.my.json",
  settingsSchema: PluginSettings,

  toBeImportedFiles: async ({ settings }) => {
    const pattern = settings["plugin.my.json"]?.pathPattern
      ?? "./messages/{locale}.json";

    return settings.locales.map((locale) => ({
      path: pattern.replace("{locale}", locale),
      locale,
    }));
  },

  // ... rest of plugin
};
```

Users configure it in `settings.json`:

```json
{
  "baseLocale": "en",
  "locales": ["en", "de", "fr"],
  "modules": ["./my-plugin.js"],
  "plugin.my.json": {
    "pathPattern": "./i18n/{locale}.json"
  }
}
```

## Complete example

Here's the full plugin:

```typescript
import type { InlangPlugin } from "@inlang/sdk";
import { Type } from "@sinclair/typebox";

const PluginSettings = Type.Object({
  pathPattern: Type.String({
    description: "Path pattern for translation files",
    examples: ["./messages/{locale}.json"],
  }),
});

export const plugin: InlangPlugin<{
  "plugin.my.json": typeof PluginSettings;
}> = {
  key: "plugin.my.json",
  settingsSchema: PluginSettings,

  toBeImportedFiles: async ({ settings }) => {
    const pattern = settings["plugin.my.json"]?.pathPattern
      ?? "./messages/{locale}.json";

    return settings.locales.map((locale) => ({
      path: pattern.replace("{locale}", locale),
      locale,
    }));
  },

  importFiles: async ({ files }) => {
    const bundles = [];
    const messages = [];
    const variants = [];

    for (const file of files) {
      const json = JSON.parse(new TextDecoder().decode(file.content));

      for (const [key, value] of Object.entries(json)) {
        bundles.push({ id: key, declarations: [] });
        messages.push({
          bundleId: key,
          locale: file.locale,
          selectors: [],
        });
        variants.push({
          messageBundleId: key,
          messageLocale: file.locale,
          matches: [],
          pattern: [{ type: "text", value: value as string }],
        });
      }
    }

    return { bundles, messages, variants };
  },

  exportFiles: async ({ messages, variants }) => {
    const filesByLocale: Record<string, Record<string, string>> = {};

    for (const message of messages) {
      const variant = variants.find((v) => v.messageId === message.id);
      const text = variant?.pattern
        .filter((p) => p.type === "text")
        .map((p) => p.value)
        .join("") ?? "";

      if (!filesByLocale[message.locale]) {
        filesByLocale[message.locale] = {};
      }
      filesByLocale[message.locale][message.bundleId] = text;
    }

    return Object.entries(filesByLocale).map(([locale, content]) => ({
      locale,
      name: `${locale}.json`,
      content: new TextEncoder().encode(JSON.stringify(content, null, 2)),
    }));
  },
};
```

## Next steps

- Handle variables: Parse `{name}` syntax into expression patterns
- Handle plurals: Create multiple variants with match conditions
- [Plugin API](/docs/plugin-api) — Full type reference
- [Data Model](/docs/data-model) — Understand bundles, messages, and variants
- [Architecture](/docs/architecture) — See how plugins fit in

