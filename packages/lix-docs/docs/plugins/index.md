# Plugins

Plugins are a core part of the Lix SDK ecosystem. They enable Lix to understand and track changes in different file formats.

## What are Plugins?

A Lix plugin is a module that provides functionality for working with specific file formats. Each plugin:

1. Understands the structure of a particular file format
2. Detects changes between different versions of a file
3. Provides schema definitions for the file's data model
4. Handles applying changes to files

## Available Plugins

Lix currently offers several official plugins:

### JSON Plugin

The JSON plugin provides support for working with JSON files:

```bash
npm install @lix-js/plugin-json
```

[Learn more about the JSON plugin →](./json)

### CSV Plugin

The CSV plugin provides support for working with CSV files:

```bash
npm install @lix-js/plugin-csv
```

[Learn more about the CSV plugin →](./csv)

### Markdown Plugin

The Markdown plugin provides support for working with Markdown files:

```bash
npm install @lix-js/plugin-md
```

[Learn more about the Markdown plugin →](./markdown)

## Using Plugins

To use a plugin, you need to provide it when opening a Lix file:

```javascript
import { openLix } from "@lix-js/sdk";
import { plugin as jsonPlugin } from "@lix-js/plugin-json";
import { plugin as csvPlugin } from "@lix-js/plugin-csv";

// Open a Lix file with support for both JSON and CSV
const lix = await openLix({
  blob: lixFile,
  providePlugins: [jsonPlugin, csvPlugin],
});
```

## Creating Custom Plugins

You can create custom plugins to support additional file formats. A plugin consists of:

1. A schema definition for the file's data model
2. Functions for detecting changes
3. Functions for applying changes

[Learn more about creating plugins →](./creating-plugins)

## Plugin Architecture

Plugins in Lix follow a modular architecture:

- Each plugin is responsible for a specific file format
- Plugins are loaded dynamically when needed
- Multiple plugins can be used together
- Plugins are self-contained and don't depend on each other

This architecture allows Lix to be extensible and support a wide range of file formats while keeping the core SDK focused on change control functionality.
