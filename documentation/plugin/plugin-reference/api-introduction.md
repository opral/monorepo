# Plugin API Introduction

The API for plugins are easy. We can sepearate them in three blocks: `meta`, `load and save messages` and `custom app api`. The meta information is used for displaying the plugin on the [marketplace](/c/plugins) or the installation process. load and save messages functions are used to define how the messages are accessed in your repo setup. The custom app api is only used if you need to pass additional information or configuration into apps.

```ts
import type { Plugin, PluginSettings } from "@inlang/plugin";
import { id, displayName, description } from "../marketplace-manifest.json";

export const plugin: Plugin<PluginSettings> = {
  id,
  displayName,
  description,
  loadMessages: async ({
    languageTags,
    sourceLanguageTag,
    settings,
    nodeishFs,
  }) => {
    // Plugin's loadMessages logic
  },
  saveMessages: async ({ messages, settings, nodeishFs }) => {
    // Plugin's saveMessages logic
  },
  addCustomApi: ({ settings }) => {},
};
```

<br/>

<doc-links>
    <doc-link title="Plugin Guide" icon="mdi:book-open-page-variant" href="/documentation/plugin/guide" description="Learn how to build your plugin."></doc-link>
    <doc-link title="API" icon="mdi:skip-next" href="/documentation/plugin/api" description="Read Plugin API Reference."></doc-link>
</doc-links>

<br/>
<br/>
