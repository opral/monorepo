---
imports: 
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc/dist/markdown-wc-embed.js
---

# Markdown WC Doc Elements (Documentation Elements)

This package provides a set of custom elements that can be used to write documentation. 

## Usage

Import the custom elements from JSDelivr and use them in markdown-wc. Replace the dist/*.js with the custom element you want to use.

```markdown
---
imports:
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-figure.js
---

<doc-figure src="https://example.com/image.png"></doc-figure>
```

## Elements

<markdown-wc-embed src="./src/doc-accordion.md"></markdown-wc-embed>
<markdown-wc-embed src="./src/doc-comment.md"></markdown-wc-embed>
<markdown-wc-embed src="./src/doc-comments.md"></markdown-wc-embed>
<markdown-wc-embed src="./src/doc-copy.md"></markdown-wc-embed>
<markdown-wc-embed src="./src/doc-feature.md"></markdown-wc-embed>
<markdown-wc-embed src="./src/doc-features.md"></markdown-wc-embed>
<markdown-wc-embed src="./src/doc-figure.md"></markdown-wc-embed>
<markdown-wc-embed src="./src/doc-header.md"></markdown-wc-embed>
<markdown-wc-embed src="./src/doc-icon.md"></markdown-wc-embed>
<markdown-wc-embed src="./src/doc-important.md"></markdown-wc-embed>
<markdown-wc-embed src="./src/doc-link.md"></markdown-wc-embed>
<markdown-wc-embed src="./src/doc-links.md"></markdown-wc-embed>
<markdown-wc-embed src="./src/doc-slider.md"></markdown-wc-embed>
<markdown-wc-embed src="./src/doc-video.md"></markdown-wc-embed>

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


