# @opral/markdown-wc

## 1.0.0

### Major Changes

- 87b5dd6: Stop injecting default inline styles into rendered HTML and remove the `inlineStyles` option. The previous default look is now provided as a separate stylesheet at `@opral/markdown-wc/default.css`, which apps can import if they want the old styling.

### Minor Changes

- b5e780c: Add support for GitHub-style alert blockquotes (`> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]`). Alerts render as standard `<blockquote>` elements annotated with `data-mwc-alert`, and include a hideable `[data-mwc-alert-marker]` span for site-specific styling (e.g. `blockquote[data-mwc-alert="note"] { ... }` and `blockquote[data-mwc-alert] [data-mwc-alert-marker]{display:none}`). Add an opt-in `externalLinks` option to open absolute http(s) links in a new tab with `rel="noopener noreferrer"`. Code blocks are annotated with `data-mwc-codeblock` for consumer styling and hydration.

## 0.5.0

### Minor Changes

- 206dd9d: give inline code blocks a background color
- 41a7580: add table column and row lines

## 0.4.1

### Patch Changes

- import mermaid component via the imports frontmatter

## 0.4.0

### Minor Changes

- 70b48a8: support for mermaid diagrams

  ```markdown
  \`\`\`mermaid
  graph TD;
  A-->B;
  A-->C;
  B-->D;
  C-->D;
  \`\`\`
  ```

## 0.3.1

### Patch Changes

- include video in readme

## 0.3.0

### Minor Changes

- 5b54306: adds dinosaur example to readme

## 0.2.0

### Minor Changes

- 015da74: Separate the markdown-wc-doc-elements package from the markdown-wc package. This package provides a set of custom elements that can be used to write (technical) documentation.
- 3c453b5: Refactor: Remove dependency on TailwindCSS to increase interoperability.
- 3c453b5: Ensure interoperability and portability by letting documents import components via frontmatter.

  ```diff
  title: "Hello World"
  +import:
  +  - "https://example.com/doc-card.js"
  +  - "https://example.com/doc-button.js"
  ---

  # Hello World
  ```

## 0.1.1

### Patch Changes

- 8805b80: Add capture events to the copy component

## 0.1.0

### Minor Changes

- 9a208b466: enhanced capabilities of product pages
