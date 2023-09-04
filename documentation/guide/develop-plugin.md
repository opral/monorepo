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

### 2. Configure your plugin

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

### 3. Implement Plugin Logic

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
