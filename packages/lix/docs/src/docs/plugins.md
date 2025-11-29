# Plugins

Plugins teach Lix how to understand specific file formats by detecting changes at the entity level and reconstructing files from entity states.

## What Plugins Do

A plugin handles two core responsibilities:

**1. Detect changes**
- Compare old and new file content
- Identify which entities changed (added, modified, or deleted)
- Return detected changes with entity IDs and snapshots

**2. Apply changes**
- Reconstruct a file from entity states
- Serialize entities back to the original file format
- Preserve structure and formatting where possible

**Optional: Render diffs**
- Generate HTML to visualize changes
- Provide custom diff UIs for specific file formats

## How Plugins Work

When you insert or update a file, Lix automatically invokes the matching plugin based on the file path:

```
File updated
  ↓
Plugin matched by glob pattern (*.json, *.md, etc.)
  ↓
Plugin.detectChanges() identifies entity changes
  ↓
Changes stored in database
```

When you read a file back:

```
Query entities from database
  ↓
Plugin.applyChanges() reconstructs file
  ↓
File data returned
```

## Using Plugins

Register plugins when opening a lix:

```ts
import { openLix } from "@lix-js/sdk";
import { plugin as jsonPlugin } from "@lix-js/plugin-json";
import { plugin as markdownPlugin } from "@lix-js/plugin-md";

const lix = await openLix({
  providePlugins: [jsonPlugin, markdownPlugin],
});

// Insert a JSON file - plugin automatically detected by *.json pattern
await lix.db
  .insertInto("file")
  .values({
    path: "/config.json",
    data: new TextEncoder().encode(JSON.stringify({ theme: "dark" })),
  })
  .execute();
```

The plugin is automatically matched based on the file path and the plugin's `detectChangesGlob` pattern.

## Building Custom Plugins

Plugins implement the `LixPlugin` interface with two main methods:

- `detectChanges({ before, after, querySync })` - Detects entity changes between file states
- `applyChanges({ file, changes })` - Reconstructs files from entity states

For implementation examples, see the official plugin source code:

- **[plugin-json](https://github.com/opral/monorepo/tree/main/packages/lix/plugin-json)** - Simple example using JSON Pointer for entity IDs
- **[plugin-md](https://github.com/opral/monorepo/tree/main/packages/lix/plugin-md)** - Advanced example with stable ID reconciliation using `querySync`

These implementations demonstrate:
- Parsing files and detecting entity changes
- Using `querySync` to preserve stable entity IDs
- Applying changes to reconstruct files
- Schema definitions for entity types

## Plugin Best Practices

**Use Stable Entity IDs**
- Generate deterministic IDs based on content or position
- Use `querySync` to preserve existing IDs across changes
- Avoid random IDs that change on every edit

**Choose the Right Granularity**
- Too fine: Many entities, complex queries, harder merges
- Too coarse: Large entities, less precise diffs
- Consider your use case: commenting needs fine granularity, auditing may not

**Handle Edge Cases**
- Empty files
- Deleted files (file.data may be undefined in applyChanges)
- Malformed content
- Unicode and special characters

**Optimize Performance**
- Use `querySync` sparingly - it's synchronous but has overhead
- Cache parsed data when possible
- Consider incremental parsing for large files

**Test Thoroughly**
- Verify `detectChanges` and `applyChanges` are inverses
- Test with various file sizes and content types
- Ensure entity IDs remain stable across edits

## Multiple Plugins

Register multiple plugins to handle different file types:

```ts
import { plugin as jsonPlugin } from "@lix-js/plugin-json";
import { plugin as csvPlugin } from "@lix-js/plugin-csv";
import { plugin as markdownPlugin } from "@lix-js/plugin-md";

const lix = await openLix({
  providePlugins: [jsonPlugin, csvPlugin, markdownPlugin],
});
```

Each file is automatically processed by the plugin whose `detectChangesGlob` pattern matches the file path.

## Finding Plugins

Browse the [plugins directory](/plugins) for official and community plugins, installation instructions, and file type coverage.

## Next Steps

- Learn about [Schemas](/docs/schemas) to understand entities and schemas
- See [SQL Interface](/docs/sql-interface) to work with plugin-detected changes
- Explore the [API Reference](/docs/api/) for detailed plugin interfaces
