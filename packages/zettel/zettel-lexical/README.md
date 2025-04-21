# Zettel Lexical

Mappings for the Zettel AST to the Lexical editor state, as well as a headless editor component.

## Installation

```bash
npm install @opral/zettel-lexical
```

## Usage

```tsx
import { ZettelDoc } from "@opral/zettel-ast";
import { ZettelLexicalEditor } from "@opral/zettel-lexical";

function Component(props: { zettel: ZettelDoc }) {

  return (
    <zettel-lexical-editor 
      zettel={props.zettel} 
      onChange={(updatedZettel) => {
        console.log(updatedZettel);
        // persist the updated zettel somewhere
      }}
    />
  );
}
```
