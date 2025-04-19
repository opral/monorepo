# Zettel editor

The zettel editor is a headless (unstyled) web component that enables rich text editing of Zettel's.

- out of the box rich text editing
- works in any framework (React, Vue, Svelte, etc.)
- extendable via custom zettel blocks

## Installation

```bash
npm install @opral/zettel-editor
```

## Usage

```tsx
function Component(props: { zettel: Zettel }) {

  return (
    <zettel-editor 
      zettel={props.zettel} 
      onChange={(updatedZettel) => {
        console.log(updatedZettel);
        // persist the updated zettel somewhere
      }}
    />
  );
}
```
