---
title: Develop a plugin
href: /documentation/develop-plugin
description: You can manually create a new project if inlang.com/new is not working for you.
---

# {% $frontmatter.title %}

## Pre-requisites

- [Node.js](https://nodejs.org/en/) (version 18 or higher)

## Step-by-step

### 1. Initialize a new plugin package

```bash
npx @inlang/cli@latest module init --type plugin
```

### 3. Configure Plugin Settings

Ensure that you configure the plugin settings appropriately within the code. Pay attention to the following settings:

- `id`: Unique identifier for your plugin.
- `displayName`: User-friendly display name for your plugin.
- `description`: A brief description of what your plugin does.

Make sure these settings accurately represent your plugin's purpose and functionality.

### 4. Implement Plugin Logic

Each of the following functions in the code represents a key aspect of your plugin's functionality:

- `loadMessages`: Load messages.
- `saveMessages`: Save messages.
- `detectedLanguageTags`: Detect language tags in the project.
- `addCustomApi`: Define app-specific APIs.


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

### 4. Test Your Plugin

Before proceeding, thoroughly test your plugin to ensure it functions correctly and extends inlang.com's functionality as intended.

### 5. Save and Use Your Plugin

Once you've completed and tested your plugin, save your changes. You can then use your custom plugin to enhance inlang.com's capabilities.

Feel free to customize your plugin further to meet your specific needs and requirements.
