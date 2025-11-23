# Lix Plugin ProseMirror

Lix plugin that tracks changes in [ProseMirror](https://prosemirror.net/) documents.

[![Screenshot of the ProseMirror example app](./assets/prosemirror.png)](https://prosemirror-example.onrender.com/)

[Try out the example app →](https://prosemirror-example.onrender.com/) • See the [example](./example) directory for a local setup.

## Installation

```bash
npm install @lix-js/sdk @lix-js/plugin-prosemirror
```

## Quick start

1) Open Lix with the ProseMirror plugin:

```ts
import { openLix } from "@lix-js/sdk";
import { plugin as prosemirrorPlugin } from "@lix-js/plugin-prosemirror";

export const lix = await openLix({ providePlugins: [prosemirrorPlugin] });
```

2) Create a ProseMirror doc in Lix:

```ts
const file = await lix.db
	.insertInto("file")
	.values({
		path: "/doc.json",
		data: new TextEncoder().encode(
			JSON.stringify({ type: "doc", content: [] }),
		),
	})
	.returningAll()
	.executeTakeFirstOrThrow();
```

3) Wire the editor:

```ts
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { lixProsemirror, idPlugin } from "@lix-js/plugin-prosemirror";

const state = EditorState.create({
	schema,
	doc: schema.nodeFromJSON({ type: "doc", content: [] }),
	plugins: [
		idPlugin(), // add stable ids if your schema doesn't provide them
		lixProsemirror({ lix, fileId: file.id }),
	],
});

const view = new EditorView(document.querySelector("#editor"), { state });
```

## How it works

- Node-per-entity: each node with an `attrs.id` (or legacy `_id`) becomes a stored entity. The document entity keeps the ordered list of child IDs.
- Content vs. structure: leaf nodes track text/marks; container nodes track attributes and the order of their children. New child nodes are captured inside their parent snapshot the first time they appear.
- Apply: `applyChanges` rebuilds the ProseMirror JSON by merging stored node snapshots and the document’s `children_order`.

## Requirements and tips

- Every node you want tracked must have a stable, unique ID in `attrs.id`. Use `idPlugin()` if your schema does not supply IDs.
- Make sure your schema allows an `id` attribute on the node types you want to track.
- Reordering children is captured via the document’s `children_order`. Inserting in the middle or reparenting nodes will appear as moves plus any node-level edits.
- Text nodes themselves do not need IDs; their parent leaf node carries the content diff.

### Adding IDs automatically

If your nodes don’t already have IDs, add the bundled `idPlugin()` so the ProseMirror plugin can track them:

```diff
{
  "type": "doc",
  "content": [
    {
      "attrs": {
+       "id": "unique-id-1"
      },
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "Hello World"
        }
      ]
    }
  ]
}
```

## Rendering diffs

You can render review-friendly diffs with [HTML Diff](https://html-diff.lix.dev/). Serialize the before/after ProseMirror JSON to HTML using your schema, then feed the two HTML strings to HTML Diff:

```ts
import { renderHtmlDiff } from "@lix-js/html-diff";
import { DOMSerializer, Schema } from "prosemirror-model";

// Convert ProseMirror JSON to HTML
const toHtml = (schema: Schema, json: any) => {
	const doc = schema.nodeFromJSON(json);
	const div = document.createElement("div");
	const fragment = DOMSerializer.fromSchema(schema).serializeFragment(doc.content);
	div.appendChild(fragment);
	return div.innerHTML;
};

const beforeHtml = toHtml(schema, beforeJson);
const afterHtml = toHtml(schema, afterJson);

const diffHtml = await renderHtmlDiff({
	beforeHtml,
	afterHtml,
	diffAttribute: "data-diff-key",
});

// Render it wherever you show reviews
document.querySelector("#diff")!.innerHTML = diffHtml;
```
