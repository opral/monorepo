# Develop a plugin

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
**Example implementation** of plugins can be found [here](https://github.com/opral/monorepo/tree/main/inlang/source-code/plugins).

### 3. Configure your plugin

In your lint rule's `marketplace-manifest.json` make sure to define the following information:

| Parameter        | Description                                               |
|----------------------|---------------------------------------------------------------|
| `id`                 | Unique identifier for your plugin.                         |
| `icon`        | Link to the icon of your plugin (optional).              |
| `gallery`        | Optional gallery, the first image acts as coverImage for your plugin.              |
| `displayName`        | A user-friendly display name for your plugin.              |
| `description`        | Briefly describe what your plugin does.              |
| `readme`             | Link to the README documentation for your plugin.          |
| `keywords`           | Keywords that describe your plugin.                        |
| `publisherName`      | Your publisher name.                                          |
| `publisherIcon`      | Link to your publisher's icon or avatar (optional).           |
| `license`            | The license under which your plugin is distributed.        |
| `module`             | The path to your plugin's JavaScript module (Please use [jsDelivr](https://www.jsdelivr.com/)).               |

Make sure these settings accurately represent your plugin's purpose and functionality.

### 4. Test your plugin

Before publishing your plugin to the marketplace, thoroughly test it to ensure it functions correctly and detects issues as intended.

### 5. Publish your plugin

To make your plugin available in the inlang.com marketplace, see [Publish on marketplace](/documentation/publish-to-marketplace).

Feel free to [join our Discord](https://discord.gg/CNPfhWpcAa) if you have any questions or need assistance developing and publishing your plugin.
