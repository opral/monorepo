---
---

# Markdown WC Doc Elements (Documentation Elements)

This package provides a set of custom elements that can be used to write documentation. 

## Elements

<markdown-wc-embed src="./src/doc-figure.md"></markdown-wc-embed>

## Usage

In markdown-wc: 

1. Import the custom elements
2. Use the custom elements in markdown

```markdown
---
imports:
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-figure.js
---

<doc-figure src="https://example.com/image.png"></doc-figure>
```

As library: 

1. Import the custom elements
2. Render markdown-wc with the custom elements

```ts
// imports and registers all custom elements 
import '@opral/markdown-wc-doc-elements';
import { parse } from "@opral/markdown-wc";

const parsed = parse(markdown);

render(parsed)
```


