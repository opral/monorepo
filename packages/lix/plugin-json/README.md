# Lix Plugin `.json`

Plugin for [Lix](https://lix.dev) that adds support for `.json` files.

It parses JSON files, tracks leaf values as individual entities using [JSON Pointer](https://datatracker.ietf.org/doc/html/rfc6901), and enables granular history and updates.

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
```

### Insert a JSON file

```ts
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
```

### Update the file

The plugin automatically detects changes at the pointer level (e.g., `/features/search`).

```ts
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

### Query file history

Retrieve previous versions of the file as a whole:

```ts
const history = await lix.db
	.selectFrom("file_history")
	.where("path", "=", "/config.json")
	.select(["data", "lixcol_commit_id"])
	.execute();

for (const version of history) {
	const content = new TextDecoder().decode(version.data);
	console.log(`Commit ${version.lixcol_commit_id}: ${content}`);
}
```

## Advanced usage

### Query specific JSON values

Every leaf value (string, number, boolean, null) is stored as a separate entity addressed by its JSON Pointer. You can query these directly:

```ts
const values = await lix.db
	.selectFrom("state")
	.where("file_id", "=", file.id)
	.where("schema_key", "=", "plugin_json_pointer_value")
	.select(["snapshot_content"])
	.execute();

for (const row of values) {
	const { path, value } = row.snapshot_content;
	console.log(`${path}: ${value}`);
}
// Output:
// /apiKey: "abc"
// /features/search: false
// /features/ai: true
```

### Query the history of a specific property

Track how a specific value changed over time without parsing the entire file history.

First, find the entity ID for the pointer you are interested in (or filter by content if supported):

```ts
// 1. Find the entity ID for '/features/search'
const entity = await lix.db
	.selectFrom("state")
	.where("file_id", "=", file.id)
	.where("schema_key", "=", "plugin_json_pointer_value")
	.selectAll()
	.execute()
	.then((rows) =>
		rows.find((row) => row.snapshot_content.path === "/features/search"),
	);

if (entity) {
	// 2. Query its history
	const history = await lix.db
		.selectFrom("state_history")
		.where("entity_id", "=", entity.entity_id)
		.orderBy("lixcol_commit_id", "desc")
		.select(["snapshot_content", "lixcol_commit_id"])
		.execute();

	for (const state of history) {
		console.log(
			`Value: ${state.snapshot_content.value} (commit: ${state.lixcol_commit_id})`,
		);
	}
}
```

### Programmatically update JSON content

You can update a specific value in the database without rewriting the file text. The plugin will reconstruct the file content automatically.

```ts
// Update just the 'apiKey'
// Note: You usually need the entity_id, which you can look up as shown above.
await lix.db
	.updateTable("state")
	.set({
		snapshot_content: {
			path: "/apiKey",
			value: "xyz_new_key",
		},
	})
	.where("entity_id", "=", apiKeyEntityId)
	.execute();
```

## Schemas

The plugin uses a single schema to represent leaf nodes in the JSON tree.

| Schema key                  | Description                                                                               |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| `plugin_json_pointer_value` | Represents a leaf value (string, number, boolean, null) at a specific JSON Pointer path. |

### Snapshot content structure

The `snapshot_content` for `plugin_json_pointer_value` looks like this:

```ts
{
  path: "/features/search", // RFC 6901 JSON Pointer
  value: true               // The value (string, number, boolean, or null)
}
```

## How it works

- **JSON Pointer granularity**: Every leaf value is addressed by its pointer (e.g., `/features/search`), and each pointer becomes a persisted entity in Lix.
- **Object diffing**: Property additions, edits, and deletions are tracked independently per key.
- **Array handling**: Array items are addressed by index (e.g., `/items/0`, `/items/1`).
  - **Note**: Insertions or reorderings in arrays will change the indices of subsequent items, appearing as updates to those pointers.
- **Apply phase**: `applyChanges` patches the parsed JSON with the incoming pointer changes and writes a serialized JSON document back to the file.

## Limitations and tips

- **Arrays are position-based**: Reordering items or inserting into the middle of an array will shift indices, causing "changes" for all subsequent items. Use stable objects (keyed maps) instead of arrays where possible if minimizing diff noise is important.
- **Valid JSON required**: The plugin expects valid JSON input; invalid JSON cannot be parsed or diffed.
- **Leaf-only tracking**: Container objects and arrays themselves are not stored as entities; only their leaf descendants are. The structure is implied by the union of all paths.
