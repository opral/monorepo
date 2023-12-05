# Build a Plugin

Plugins are a powerful way to extend the functionality of inlang applications. This documentation provides you with the information you need to develop your own plugin.

## Pre-requisites

- [Node.js](https://nodejs.org/en/) (version 18 or higher)

## Step-by-step

### 1. Initialize a new plugin module

```bash
npx @inlang/cli@latest module init --type plugin
```

### 2. Implement Plugin Logic

Each of the following functions in the code represents a key aspect of your plugin's functionality:

- `loadMessages`: Load messages
- `saveMessages`: Save messages
- `addCustomApi`: Define app-specific APIs


```typescript
import type { Plugin, PluginSettings } from "@inlang/plugin"
import { id, displayName, description } from "../marketplace-manifest.json"

export const plugin: Plugin<PluginSettings> = {
	meta: {
		id: id as Plugin["id"],
		displayName,
		description,
	},
	loadMessages: async ({ languageTags, sourceLanguageTag, settings, nodeishFs }) => {
		// Plugin's loadMessages logic
	},
	saveMessages: async ({ messages, settings, nodeishFs }) => {
		// Plugin's saveMessages logic
	},
	addCustomApi: ({ settings }) => {},
}
```

Implement the logic for each function according to your plugin's requirements.
**Example implementation** of plugins can be found [here](https://github.com/inlang/monorepo/tree/main/inlang/source-code/plugins).