# Lix Plugin `.md`

Plugin for [Lix](https://lix.dev) that tracks changes in Markdown files.

It parses Markdown into the [`@opral/markdown-wc`](https://markdown-wc.opral.com/) AST, tracks top-level blocks as entities, and renders rich diffs via [HTML Diff](https://html-diff.lix.dev/).

## Installation

```bash
npm install @lix-js/sdk @lix-js/plugin-md
```

## Quick start

```ts
import { openLix } from "@lix-js/sdk";
import { plugin as markdownPlugin } from "@lix-js/plugin-md";

const lix = await openLix({ providePlugins: [markdownPlugin] });
```

### Insert a Markdown file

```ts
const file = await lix.db
	.insertInto("file")
	.values({
		path: "/notes.md",
		data: new TextEncoder().encode(`# Heading\n\nFirst paragraph.`),
	})
	.returningAll()
	.executeTakeFirstOrThrow();
```

### Update the file

```ts
await lix.db
	.updateTable("file")
	.set({
		data: new TextEncoder().encode(
			`# Heading\n\nFirst paragraph.\n\nNew note.`,
		),
	})
	.where("id", "=", file.id)
	.execute();
```

### Query file history

Retrieve previous versions of the file:

```ts
const history = await lix.db
	.selectFrom("file_history")
	.where("path", "=", "/notes.md")
	.select(["data", "lixcol_commit_id"])
	.execute();

for (const version of history) {
	const content = new TextDecoder().decode(version.data);
	console.log(`Commit ${version.lixcol_commit_id}: ${content}`);
}
```

## Advanced usage

### Query all headings in a file

Each markdown block (heading, paragraph, list, etc.) is stored as a structured entity, enabling queries like "get all headings":

```ts
const headings = await lix.db
	.selectFrom("state")
	.where("file_id", "=", file.id)
	.where("schema_key", "=", "markdown_wc_heading")
	.select(["entity_id", "snapshot_content"])
	.execute();

for (const heading of headings) {
	const node = heading.snapshot_content;
	const depth = node.depth; // 1-6
	const text = node.children?.[0]?.value;
	console.log(`H${depth}: ${text}`);
}
```

### Query the history of a specific heading

Track how a specific block changed over time using `state_history`:

```ts
// Get the history of a specific heading across all checkpoints
const headingHistory = await lix.db
	.selectFrom("state_history")
	.where("entity_id", "=", headingEntityId)
	.where("schema_key", "=", "markdown_wc_heading")
	.where("root_commit_id", "=", latestCommitId)
	.orderBy("depth", "asc")
	.select(["snapshot_content", "depth", "commit_id"])
	.execute();

for (const state of headingHistory) {
	const text = state.snapshot_content.children?.[0]?.value;
	console.log(`Depth ${state.depth}: "${text}" (commit: ${state.commit_id})`);
}
// Depth 0: "Updated Title" (commit: abc123)
// Depth 1: "Original Title" (commit: def456)
```

### Programmatically update markdown content

Useful for rich-text editing frameworks like [TipTap](https://tiptap.dev/), or AI agents that update slices of a markdown document without rewriting the entire file:

```ts
// Update just the heading, leaving other blocks unchanged
await lix.db
	.updateTable("state")
	.set({
		snapshot_content: {
			type: "heading",
			depth: 1,
			data: { id: entityId },
			children: [{ type: "text", value: "Updated Title" }],
		},
	})
	.where("entity_id", "=", entityId)
	.where("schema_key", "=", "markdown_wc_heading")
	.where("file_id", "=", file.id)
	.execute();

// The file content is automatically updated by the plugin
```

### Query document structure

Get the ordered list of block IDs to understand document structure:

```ts
const doc = await lix.db
	.selectFrom("state")
	.where("file_id", "=", file.id)
	.where("schema_key", "=", "markdown_wc_document")
	.where("entity_id", "=", "root")
	.select("snapshot_content")
	.executeTakeFirst();

const blockOrder = doc?.snapshot_content?.order; // ["heading_1", "para_1", "para_2"]
```

## Schemas

The plugin uses [markdown-wc](https://markdown-wc.opral.com/) schemas to represent markdown AST nodes. Each top-level block is stored as an entity with its own schema.

### Document order schema

| Schema key             | Description                                  |
| ---------------------- | -------------------------------------------- |
| `markdown_wc_document` | Stores the `order` array of block entity IDs |

### Block-level schemas (persisted as entities)

| Schema key                   | Node type       | Description                          |
| ---------------------------- | --------------- | ------------------------------------ |
| `markdown_wc_heading`        | `heading`       | Heading blocks (h1-h6, `depth: 1-6`) |
| `markdown_wc_paragraph`      | `paragraph`     | Paragraph blocks                     |
| `markdown_wc_list`           | `list`          | List blocks (ordered/unordered)      |
| `markdown_wc_blockquote`     | `blockquote`    | Blockquote blocks                    |
| `markdown_wc_code`           | `code`          | Fenced code blocks (`lang`, `value`) |
| `markdown_wc_table`          | `table`         | GFM tables                           |
| `markdown_wc_thematic_break` | `thematicBreak` | Horizontal rules                     |
| `markdown_wc_html`           | `html`          | Raw HTML blocks                      |
| `markdown_wc_yaml`           | `yaml`          | YAML frontmatter                     |

### Inline schemas (nested within blocks)

| Schema key                | Node type    | Description                           |
| ------------------------- | ------------ | ------------------------------------- |
| `markdown_wc_text`        | `text`       | Plain text                            |
| `markdown_wc_strong`      | `strong`     | Bold text                             |
| `markdown_wc_emphasis`    | `emphasis`   | Italic text                           |
| `markdown_wc_delete`      | `delete`     | Strikethrough text                    |
| `markdown_wc_link`        | `link`       | Links (`url`, `title`)                |
| `markdown_wc_image`       | `image`      | Images (`url`, `alt`, `title`)        |
| `markdown_wc_inline_code` | `inlineCode` | Inline code                           |
| `markdown_wc_break`       | `break`      | Hard line breaks                      |
| `markdown_wc_list_item`   | `listItem`   | List items (`checked` for task lists) |
| `markdown_wc_table_row`   | `tableRow`   | Table rows                            |
| `markdown_wc_table_cell`  | `tableCell`  | Table cells                           |

### Snapshot content structure

Each block's `snapshot_content` follows the [mdast](https://github.com/syntax-tree/mdast) structure:

```ts
// Heading example
{
	type: "heading",
	depth: 2,
	data: { id: "block_abc123" },
	children: [
		{ type: "text", value: "Section Title" }
	]
}

// Paragraph with formatting
{
	type: "paragraph",
	data: { id: "block_def456" },
	children: [
		{ type: "text", value: "This is " },
		{ type: "strong", children: [{ type: "text", value: "bold" }] },
		{ type: "text", value: " text." }
	]
}

// List example
{
	type: "list",
	ordered: false,
	data: { id: "block_ghi789" },
	children: [
		{
			type: "listItem",
			checked: null, // or true/false for task lists
			children: [
				{ type: "paragraph", children: [{ type: "text", value: "Item 1" }] }
			]
		}
	]
}
```

## How it works

- **Block-level entities**: Each top-level mdast node (paragraphs, headings, lists, tables, code blocks, etc.) is stored as its own entity. The root entity keeps the ordering of those blocks.
- **Stable IDs without markup**: IDs are minted automatically and kept out of the serialized Markdown, so you do not need to add markers to your documents.
- **Nested awareness**: Nested nodes (list items, table cells, inline spans) get ephemeral IDs during diffing to align edits but are not persisted as separate entities.
- **Similarity-based matching**: The detector uses textual similarity and position hints to decide whether a block was edited, moved, inserted, or deleted, even when headings or paragraphs change slightly.
- **Apply & render**: `applyChanges` rebuilds Markdown from stored snapshots, and `renderDiff` produces an HTML diff (using `@lix-js/html-diff`) that highlights before/after content with `data-diff-key` markers.

## Limitations and tips

- Changes are tracked per top-level block; inline-level differences are aggregated into the parent block.
- Replacing an entire block with unrelated content will be treated as a delete + insert instead of a modification.
- Large documents are supported, but providing reasonably distinct headings/paragraphs improves block matching when content is rearranged.
