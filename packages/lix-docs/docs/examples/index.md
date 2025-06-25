# Examples

This section provides practical examples of using the Lix SDK for common scenarios.

## Overview

Lix SDK can be used to build a variety of applications that benefit from change control. The examples in this section demonstrate how to:

- Set up a basic Lix application
- Work with different file formats
- Manage versions and branches
- Implement collaboration features
- Build complete applications

## Quick Example

Here's a simple example of using Lix SDK to track changes in a JSON file:

```javascript
import { newLixFile, openLixInMemory } from "@lix-js/sdk";
import { plugin as jsonPlugin } from "@lix-js/plugin-json";

// Create and open a new Lix file
const lixFile = await newLixFile();
const lix = await openLixInMemory({
  blob: lixFile,
  providePlugins: [jsonPlugin],
});

// Insert a JSON file
const data = {
  name: "My Project",
  version: "1.0.0",
  settings: { theme: "dark", fontSize: 14 }
};

await lix.db
  .insertInto("file")
  .values({
    path: "/config.json",
    data: new TextEncoder().encode(JSON.stringify(data)),
  })
  .execute();

// Make a change
data.version = "1.1.0";
data.settings.fontSize = 16;

await lix.db
  .updateTable("file")
  .set({
    data: new TextEncoder().encode(JSON.stringify(data)),
  })
  .where("path", "=", "/config.json")
  .execute();

// View the changes
const changes = await lix.db
  .selectFrom("change")
  .innerJoin("file", "file.id", "change.file_id")
  .where("file.path", "=", "/config.json")
  .selectAll()
  .execute();

console.log("Changes:", changes);
```

## Example Categories

The examples are organized into categories:

- [Basic Usage](./basic-usage) - Simple examples for getting started
- [Version Management](./version-management) - Working with versions and branches
- [Collaboration](./collaboration) - Implementing collaboration features
- [Building an App](./building-an-app) - Creating complete applications

Each example includes:
- Full code samples
- Step-by-step explanations
- Tips for best practices
- Variations for different use cases

## Live Examples

For interactive examples, visit our [demo application](https://lix.opral.com/app/fm) to see Lix in action.