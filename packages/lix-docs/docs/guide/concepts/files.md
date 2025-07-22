# Files

Files in Lix are **exactly what you expect** — JSON, CSV, Word documents, PDFs, images, or any custom format your app uses.

The super-power is that **Lix understands the _content_ inside those formats**:

- Edit a JSON file → Lix tracks which properties changed
- Update a CSV → Lix knows which cells were added or modified
- Modify a Word document → Lix captures which paragraphs changed

Unlike Git which tracks line-by-line changes, Lix tracks the actual content units (e.g. properties, paragraphs, rows) as separate entities. All entities with the same `file_id` are grouped together — they share the same lifecycle and move as one logical file.

### Quick benefits

| What you get                         | Why you care                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| **Content-aware change control**     | Diff whole files _or_ drill down to cells, blocks, or props.                                     |
| **Built-in "last touched" metadata** | `lixcol_updated_at` / `lixcol_change_id` always show the freshest edit—ideal for file explorers. |
| **Time travel**                      | `file_history` view lets you materialise any past version for previews, rollbacks, or audits.    |

## Getting started - everyday CRUD

```ts
// CREATE
await lix.db
  .insertInto("file")
  .values({
    path: "/example.json",
    data: new TextEncoder().encode(JSON.stringify({ key: "value" })),
  })
  .execute();

// READ
const file = await lix.db
  .selectFrom("file")
  .where("path", "=", "/example.json")
  .selectAll()
  .executeTakeFirstOrThrow();

const json = JSON.parse(new TextDecoder().decode(file.data));

// UPDATE
await lix.db
  .updateTable("file")
  .set({ data: new TextEncoder().encode(JSON.stringify({ key: "new value" })) })
  .where("path", "=", "/example.json")
  .execute();

// DELETE (descriptor + all content entities)
await lix.db.deleteFrom("file").where("path", "=", "/example.json").execute();
```

## How files work under the hood

A file is a **SQL view** that combines the file descriptor with all content entities reported by plugins. Here's what Lix actually stores:

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Storage Layer                            │
├─────────────────────────────────────┬───────────────────────────────┤
│    File Descriptor Entity           │     Plugin Content Entities   │
│  (schema: lix_file_descriptor)      │   (schema: varies by plugin)  │
├─────────────────────────────────────┼───────────────────────────────┤
│  • id, path, metadata, hidden …     │  • JSON props, cells, blocks… │
│  • bookkeeping columns              │  • file_id → descriptor.id    │
└─────────────────────────────────────┴───────────────────────────────┘
                    ↓ SQL view merges these rows ↓
┌─────────────────────────────────────────────────────────────────────┐
│                              File View                             │
│                  (schema: lix_file_descriptor)                     │
├─────────────────────────────────────────────────────────────────────┤
│  • All descriptor fields                                           │
│  • data (Uint8Array — materialised content)                        │
│  • lixcol_change_id / lixcol_updated_at (latest across the file)   │
└─────────────────────────────────────────────────────────────────────┘
```

_SQL devs_: it’s a classic **view**.  
_Event-sourcing folks_: you’d call it a **projection**. Same idea.

**Why does the file view return `lix_file_descriptor` as its schema key?**

The file descriptor acts as the "root" entity that ties all content together. When you label a
file or create any reference to it, you're addressing the whole file unit — not just
individual properties or blocks inside. Using `lix_file_descriptor` ensures:

- **Foreign key integrity** — references point to an actual entity that exists in the database
- **Logical grouping** — all content entities share the same `file_id`, making the descriptor
  the natural anchor point
- **Consistent behavior** — operations like labeling work the same way for files as for any
  other entity

### What happens on updates?

When you update a file:

1. **Plugins diff the new bytes** against the previous version
2. **Lix inserts one change row per modified entity** - if you change 3 JSON properties,
   that's 3 change rows
3. **The file view recalculates** `lixcol_updated_at` / `lixcol_change_id` to reflect the
   latest change anywhere in the file

This aggregation ensures file explorers always show accurate "last modified" times without
extra queries.

## History & time travel

```ts
const history = await lix.db
  .selectFrom("file_history")
  .where("id", "=", "file123")
  .orderBy("lixcol_depth", "asc") // 0 = current version
  .selectAll()
  .execute();
```

| Column                 | Meaning                                  |
| ---------------------- | ---------------------------------------- |
| `lixcol_change_set_id` | Change-set that produced this revision   |
| `lixcol_depth`         | How many edges away from current version |
| `data`                 | Snapshot materialised at that point      |

## Plugin ecosystem

Check out [available plugins](/guide/plugins) to see how Lix can handle various file formats like JSON, CSV, Markdown, and more. You can also write your own plugins to support custom formats.

```ts
const lix = await openLix({
  providePlugins: [jsonPlugin, csvPlugin, markdownPlugin],
});
```

## API Reference quick-links

| Type / Interface    | Purpose                              | Docs                                |
| ------------------- | ------------------------------------ | ----------------------------------- |
| `LixFile`           | Unified record (`descriptor + data`) | [API](/api/types/LixFile)           |
| `LixFileDescriptor` | Raw metadata row                     | [API](/api/types/LixFileDescriptor) |
