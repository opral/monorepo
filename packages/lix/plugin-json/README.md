# Lix Plugin `.json`

This plugin adds support for `.json` files in Lix.

## Installation

```bash
npm install @lix-js/sdk @lix-js/plugin-json
```

## Quick start

```ts
import { openLix, newLixFile } from "@lix-js/sdk";
import { plugin as jsonPlugin } from "@lix-js/plugin-json";

const lixFile = await newLixFile();
const lix = await openLix({
	blob: lixFile,
	providePlugins: [jsonPlugin],
});

// Insert a JSON file
const file = await lix.db
	.insertInto("file")
	.values({
		path: "/config.json",
		data: new TextEncoder().encode(
			JSON.stringify({ apiKey: "abc", features: { search: true } }, null, 2),
		),
	})
	.returningAll()
	.executeTakeFirstOrThrow();

// Update the file later — the plugin will detect pointer-level changes
await lix.db
	.updateTable("file")
	.set({
		data: new TextEncoder().encode(
			JSON.stringify(
				{ apiKey: "abc", features: { search: false, ai: true } },
				null,
				2,
			),
		),
	})
	.where("id", "=", file.id)
	.execute();
```

## How it works

- JSON Pointer granularity: every leaf value is addressed by its pointer (for example `/features/search`), and each pointer becomes an entity in Lix.
- Object diffing: property additions, edits, and deletions are tracked independently per key.
- Array handling: array items are addressed by index. Insertions or reorderings create multiple changes because indices serve as the identity.
- Apply phase: `applyChanges` patches the parsed JSON with the incoming pointer changes and writes a serialized JSON document back to the file.

## Limitations and tips

- Arrays are position-based. Reordering items or inserting into the middle will appear as several deletions/insertions.
- The plugin expects valid JSON input; invalid JSON cannot be parsed or diffed.
- Large, deeply nested objects are supported, but providing stable array ordering reduces noisy diffs.
