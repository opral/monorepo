# Inlang file format SDK

[![NPM Downloads](https://img.shields.io/npm/dw/%40inlang%2Fsdk?logo=npm&logoColor=red&label=npm%20downloads)](https://www.npmjs.com/package/@inlang/sdk) [![Discord](https://img.shields.io/discord/897438559458430986?style=flat&logo=discord&labelColor=white)](https://discord.gg/gdMPPWy57R)


<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/packages/sdk/assets/open-file.svg" alt="Inlang SDK opens .inlang files">
</p>

## Outline

- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [Plugins](#plugins)
- [API reference](#api-reference)
- [Listing on inlang.com](#listing-on-inlangcom)

## Introduction

The inlang SDK is the official specification and parser for `.inlang` files. 

`.inlang` files are designed to become the open standard for i18n and enable interoperability between i18n solutions. Such solutions involve apps like [Fink](https://inlang.com/m/tdozzpar/app-inlang-finkLocalizationEditor), libraries like [Paraglide JS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs), or plugins that extend inlang.

### Core Features

- 📁 **File-based**: Interoperability without cloud integrations or lock-in.
- 🖊️ **CRUD API**: Query messages with SQL.
- 🧩 **Plugin System**: Extend the capabilities with plugins.
- 📦 **Import/Export**: Import and export messages in different file formats.
- [<img src="https://raw.githubusercontent.com/opral/monorepo/refs/heads/main/lix/assets/lix-icon.svg" width="20" height="12" alt="Lix Icon">**Change control**](https://lix.opral.com/): Collaboration, change proposals, reviews, and automation. 



## Getting Started

> [!Note]
> Inlang files can be unpacked and [stored as directories](#unpacked-inlang-files-directories). The long-term goal is to have portable `.inlang` files. Hence, the documentation refers to files instead of directories.

### Installation

```bash
npm install @inlang/sdk
```

### Loading an inlang file

```ts
import { loadProjectInMemory, newProject } from "@inlang/sdk";

const project = await loadProjectInMemory({
  blob: await newProject()
});

// query the project
project.*
```

### Next steps

Go to the [API reference](#api-reference) to learn how to query messages, changes, and save the project.


## Plugins

The inlang SDK supports plugins to extend its functionality. 

Plugins can be used to import/export messages in different formats, add custom validation rules, and implement specialized workflows.

### Available Plugins

Find available plugins on https://inlang.com/c/plugins.

### Creating a Plugin

#### Getting started

Implement the `InlangPlugin` type. 

Examples can be found [here](https://github.com/opral/monorepo/tree/main/inlang/packages/plugins). Particulary the [message format plugin](https://github.com/opral/monorepo/tree/main/inlang/packages/plugins/inlang-message-format) is a good starting point.

```typescript
const myPlugin: InlangPlugin = {
  key: "my-plugin",
  importFiles: () => {
    // Import files logic
  },
  exportFiles: () => {
    // Export files logic
  },
};
```

#### Deploying a plugin 

> [!NOTE]  
> Why is a CDN requires instead of using npm to use plugins?
>
> Non-JS projects (Android, iOS, etc.) wouldn't be able to use inlang, and browser-based apps like [Fink](https://inlang.com/m/tdozzpar/app-inlang-finkLocalizationEditor) couldn't load plugins. 

```bash
npx @inlang/cli plugin build --entry ./src/plugin.js 
```

We recommend uploading the plugin to NPM which makes it automatically available on [JSDelivr](https://www.jsdelivr.com/) and enables users to pin the version of your plugin. 

```diff
https://cdn.jsdelivr.net/npm/my-plugin@1/dist/index.js
```

## API reference

### Creating a new project

```typescript
import { newProject } from "@inlang/sdk";

// Create a new project
const file = await newProject();

// write the file anywhere you want
await fs.writeFile("./project.inlang", file);
```

### Loading a project

```typescript
import { loadProjectInMemory } from "@inlang/sdk";

const file = await fs.readFile("./project.inlang");

// Load a project from a directory
const project = await loadProjectInMemory({
  blob: file
});
```

### Querying a project

```typescript
// Accessing settings and plugins
const settings = await project.settings.get();
const plugins = await project.plugins.get();

// Querying messages
const messages = await project.db
  .selectFrom("message")
  .selectAll()
  .execute();

console.log(messages);
```

### Querying changes

> [!NOTE]  
> The inlang plugin for lix is work in progress. If you stumble on issues, please open an issue on the [GitHub](https://github.com/opral/inlang-sdk).

The inlang file format uses lix for change control. The lix APIs are exposed via `project.lix.*`. Visit the [lix documentation](https://lix.opral.com/) for more information on how to query changes.

```typescript
const changes = await project.lix.db
  .selectFrom("change")
  .selectAll()
  .execute();
```

### Saving a project

```typescript
const newFile = await project.toBlob();

await fs.writeFile("./project.inlang", newFile);
```

### Importing and exporting translation files

The import and export of messages depends on the installed plugins. The following example shows how to import and export messages using a plugin that supports JSON files.

```typescript
const file = await fs.readFile("./en.json");

// Import files
await project.importFiles({
  pluginKey: "plugin.inlang.messageFormat",
  files: [
    { locale: "en", content: file },
  ],
});

// Export files
const files = await project.exportFiles({
  pluginKey: "plugin.inlang.messageFormat"
});

await fs.writeFile("./en.json", files[0].content);
```

### Installing plugins

```typescript
const settings = await project.settings.get();

settings.modules.push(
  "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@latest/dist/index.js"
)

await project.settings.set(settings)
```

### Unpacked inlang files (directories)

> [!NOTE]  
> Unpacked inlang files are a workaround to store inlang files in git. 
>
> Git can't handle binary files. **If you don't intend to store the inlang file in git, do not use unpacked inlang files.** 
> 
> Unpacked inlang files are not portable. They depent on plugins that and do not persist [lix change control](https://lix.opral.com/) data.

```typescript
import { 
    loadProjectFromDirectory, 
    saveProjectToDirectory 
} from "@inlang/sdk";

const project = await loadProjectFromDirectory({
    "path": "./project.inlang"
});

// modify the project

await saveProjectToDirectory({
    "project": project,
    "path": "./project.inlang"
});
```


## Listing on inlang.com

To list your app/plugin on inlang.com, please open a pull request to the [registry.json file](https://github.com/opral/monorepo/blob/main/inlang/packages/marketplace-registry/registry.json). 

Make sure that the link you are contributing points to a `marketplace-manifest.json` file. An example of can be found [here](https://github.com/opral/monorepo/blob/main/inlang/packages/fink/marketplace-manifest.json)
