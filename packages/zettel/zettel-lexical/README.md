# Zettel Lexical

Mappings for the Zettel AST to the Lexical editor state, as well as a headless editor component.

## Installation

```bash
npm install @opral/zettel-ast @opral/zettel-lexical
```

## Getting started

```tsx
import { ZettelDoc } from "@opral/zettel-ast";
import { ZettelNodes, registerZettelLexicalPlugin } from "@opral/zettel-lexical";


// register the zettel nodes
const editor = createEditor({
  nodes: [...ZettelNodes],
});
// register the zettel plugin
registerZettelLexicalPlugin(editor);
```

## Getting the AST

```tsx
const lexicalState = editor.getEditorState().toJSON();
const zettelDoc = fromLexicalState(lexicalState);
```

## Setting the AST

```tsx
const lexicalState = toLexicalState(zettelDoc);
editor.setEditorState(editor.parseEditorState(lexicalState));
```
