# Getting Started with Lix SDK

This guide will help you get started with the Lix SDK and demonstrate basic usage patterns.

## Installation

Install the Lix SDK package:

```bash
npm install @lix-js/sdk
```

You'll also need at least one plugin to handle specific file formats. For this example, we'll use the JSON plugin:

```bash
npm install @lix-js/plugin-json
```

## Creating and Opening a Lix File

The first step is to create a new Lix file and open it:

```javascript
import { newLixFile, openLixInMemory } from "@lix-js/sdk";
import { plugin as jsonPlugin } from "@lix-js/plugin-json";

// Create a new empty Lix file
const lixFile = await newLixFile();

// Open the Lix file in memory
const lix = await openLixInMemory({
  blob: lixFile,
  providePlugins: [jsonPlugin],
});
```

*See implementation: [newLixFile](https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/lix/new-lix.ts), [openLixInMemory](https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/lix/open-lix-in-memory.ts)*

## Inserting Files

Now that we have our Lix instance, we can insert a file into it. Here's how to insert a JSON file:

```javascript
const json = {
  name: "Hello World",
  version: "1.0.0",
  settings: {
    enableFeatureX: true,
    maxUsers: 10,
  },
};

// Insert the file 
const file = await lix.db
  .insertInto("file")
  .values({
    path: "/example.json",
    data: new TextEncoder().encode(JSON.stringify(json)),
  })
  .returningAll()
  .executeTakeFirstOrThrow();

console.log("JSON file inserted with ID:", file.id);
```

## Updating Files

Let's update our JSON file with some changes:

```javascript
// Update the JSON object
json.version = "1.1.0";
json.settings.maxUsers = 20;

// Update the file
await lix.db
  .updateTable("file")
  .set({
    data: new TextEncoder().encode(JSON.stringify(json)),
  })
  .where("path", "=", "/example.json")
  .execute();
```

Lix will automatically detect changes in file updates through the provided plugin.

## Querying Changes

To view the changes that were made to the file:

```javascript
// Get all changes for this file
const changes = await lix.db
  .selectFrom("change")
  .where("file_id", "=", file.id)
  .innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
  .execute();

console.log("Changes for the JSON file:", changes);
```

## Creating and Switching Versions

You can create different versions (similar to branches in Git):

```javascript
import { createVersion, switchVersion } from "@lix-js/sdk";

// Create a new version based on the current version
const versionB = await createVersion({ lix, name: "B" });

// Switch to the new version
await switchVersion({ lix, to: versionB });

console.log("New version created:", versionB.id);
```

*See implementation: [createVersion](https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/version/create-version.ts), [switchVersion](https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/version/switch-version.ts)*

## Further Reading

To learn more about Lix and its capabilities, check out:

- [How Lix Works](./how-lix-works) - Understand the core architecture
- [Core Concepts](./concepts/files) - Learn about the fundamental concepts
- [API Reference](/api/) - Explore the complete API documentation
- [Examples](/examples/) - See practical usage examples

In the next section, we'll dive deeper into how Lix works and explore its architecture.