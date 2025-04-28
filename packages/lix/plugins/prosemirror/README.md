# Lix Plugin Prosemirror

This package enables change control for [ProseMirror](https://prosemirror.net/) documents using the Lix SDK.

An example can be found in the [example](./example) directory.

## Installation

```bash
npm install @lix-js/sdk @lix-js/plugin-prosemirror 
```

## Getting Started

### Initialize Lix with the Prosemirror Plugin

```ts
import { openLixInMemory } from "@lix-js/sdk";
import { plugin as prosemirrorPlugin } from "@lix-js/plugin-prosemirror";

export const lix = await openLixInMemory({
  providePlugins: [prosemirrorPlugin],
});
```

### Create and Insert a Prosemirror Document

```ts
export const prosemirrorFile = await lix.db
  .insertInto("file")
  .values({
    path: "/prosemirror.json",
    data: new TextEncoder().encode(
      JSON.stringify({
        type: "doc",
        content: [],
      }),
    ),
  })
  .execute();
```

### Add the `lixProsemirror` Plugin to Your Editor State

When configuring your ProseMirror editor, add the `lixProsemirror` plugin to your editor state's plugins array:

```ts
import { lixProsemirror, idPlugin } from "@lix-js/plugin-prosemirror";
import { EditorState } from "prosemirror-state";

const state = EditorState.create({
  doc: schema.nodeFromJSON(/* ... */),
  schema,
  plugins: [
    // ...other plugins...
    idPlugin(),
    lixProsemirror({
      lix, // your lix instance
      fileId: prosemirrorFile.id, // the file id of your Prosemirror document
    }),
  ],
});
```

### (Optional) Add the `idPlugin` if Your Nodes Lack Unique IDs

If your ProseMirror document nodes do not have unique IDs, you should also add the `idPlugin`:

```ts
import { idPlugin } from "@lix-js/plugin-prosemirror";
// ...other plugins...
idPlugin(),
```


## How it works

The lix prosemirror plugin tracks changes in the Prosemirror document with unique IDs. 

If you don't have a id for your nodes yet, use the `idPlugin()` to add them:

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