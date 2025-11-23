# Lix Plugin `.md`

Lix plugin that tracks changes in Markdown files.

It parses Markdown into the [`@opral/markdown-wc`](https://www.npmjs.com/package/@opral/markdown-wc) AST, tracks top-level blocks as entities, and renders rich diffs via [HTML Diff](https://html-diff.lix.dev/). The plugin follows the [markdown-wc spec](https://markdown-wc.opral.com/), giving Lix a stable Markdown shape to detect, apply, and render changes against.

## Installation

```bash
npm install @lix-js/sdk @lix-js/plugin-md
```

## Quick start

```ts
import { openLix, newLixFile } from "@lix-js/sdk";
import { plugin as markdownPlugin } from "@lix-js/plugin-md";

const lixFile = await newLixFile();
const lix = await openLix({ blob: lixFile, providePlugins: [markdownPlugin] });

// Insert a Markdown file
const file = await lix.db
	.insertInto("file")
	.values({
		path: "/notes.md",
		data: new TextEncoder().encode(`# Heading\n\nFirst paragraph.`),
	})
	.returningAll()
	.executeTakeFirstOrThrow();

// Update the file later on — the plugin will detect block-level changes
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

## How it works

- Block-level entities: Each top-level mdast node (paragraphs, headings, lists, tables, code blocks, etc.) is stored as its own entity. The root entity keeps the ordering of those blocks.
- Stable IDs without markup: IDs are minted automatically and kept out of the serialized Markdown, so you do not need to add markers to your documents.
- Nested awareness: Nested nodes (list items, table cells, inline spans) get ephemeral IDs during diffing to align edits but are not persisted as separate entities.
- Similarity-based matching: The detector uses textual similarity and position hints to decide whether a block was edited, moved, inserted, or deleted, even when headings or paragraphs change slightly.
- Apply & render: `applyChanges` rebuilds Markdown from stored snapshots, and `renderDiff` produces an HTML diff (using `@lix-js/html-diff`) that highlights before/after content with `data-diff-key` markers.

## Limitations and tips

- Changes are tracked per top-level block; inline-level differences are aggregated into the parent block.
- Replacing an entire block with unrelated content will be treated as a delete + insert instead of a modification.
- Large documents are supported, but providing reasonably distinct headings/paragraphs improves block matching when content is rearranged.
