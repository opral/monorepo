---
title: Develop a plugin
href: /documentation/develop-plugin
description: Learn how easy it is to write your own plugin for inlang projects.
---

# {% $frontmatter.title %}

## Pre-requisites

- [Node.js](https://nodejs.org/en/) (version 18 or higher)

## Step-by-step

### 1. Initialize a new plugin package

```bash
npx @inlang/cli@latest module init --type plugin
```

### 2. Implement Plugin Logic

Each of the following functions in the code represents a key aspect of your plugin's functionality:

- `loadMessages`: Load messages
- `saveMessages`: Save messages
- `detectedLanguageTags`: Detect language tags in the project
- `addCustomApi`: Define app-specific APIs


```typescript
import type { Plugin, PluginSettings } from "@inlang/plugin"
import { id, displayName, description } from "../marketplace-manifest.json"

export const plugin: Plugin<PluginSettings> = {
	meta: {
		id: id as Plugin["meta"]["id"],
		displayName,
		description,
	},
	loadMessages: async ({ languageTags, sourceLanguageTag, settings, nodeishFs }) => {
		// Plugin's loadMessages logic
	},
	saveMessages: async ({ messages, settings, nodeishFs }) => {
		// Plugin's saveMessages logic
	},
	detectedLanguageTags: async ({ nodeishFs, settings }) => {
		// Plugin's detectedLanguageTags logic
	},
	addCustomApi: ({ settings }) => {},
}
```

Implement the logic for each function according to your plugin's requirements.
**Example implementation** of plugins can be found [here](https://github.com/inlang/inlang/tree/armageddon/source-code/plugins).

### 3. Configure your plugin

In your lint rule's `marketplace-manifest.json` make sure to define the following information:

| **Parameter**        | **Description**                                               |
|----------------------|---------------------------------------------------------------|
| `id`                 | Unique identifier for your lint rule.                         |
| `displayName`        | A user-friendly display name for your lint rule.              |
| `description`        | Briefly describe what your lint rule checks for.              |
| `readme`             | Link to the README documentation for your lint rule.          |
| `keywords`           | Keywords that describe your lint rule.                        |
| `publisherName`      | Your publisher name.                                          |
| `publisherIcon`      | Link to your publisher's icon or avatar (optional).           |
| `license`            | The license under which your lint rule is distributed.        |
| `module`             | The path to your lint rule's JavaScript module.               |

Make sure these settings accurately represent your plugin's purpose and functionality.

### 4. Test your plugin

Before publishing your plugin to the marketplace, thoroughly test it to ensure it functions correctly and detects issues as intended.

### 5. Publish your plugin

To make your plugin available in the inlang.com marketplace, see [Publish on marketplace](/documentation/publish-marketplace).

Feel free to [join our Discord](https://discord.gg/gdMPPWy57R) if you have any questions or need assistance developing and publishing your plugin.
