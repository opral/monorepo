# HTML Diff

HTML Diff is a simple way to generate and display diffs for any app UI.

- 🌐 **Universal**: Works for any app that renders to HTML (which is most apps!)
- ⚡ **Simple**: No need for renderer-specific diff logic.
- 🎨 **Uses your styles**: Uses your existing CSS.
- 🔧 **Framework Agnostic**: Works with React, Vue, Svelte, Angular, and more.

Visit [the documentation](https://html-diff.lix.dev) for more information.

## Installation

```bash
pnpm add @lix-js/html-diff
```

Optional default styling:

```ts
import "@lix-js/html-diff/default.css";
```

## Quickstart

Assume you want to diff a table that's displayed to users. You render the before and after HTML, then pass both into the `renderHtmlDiff` function to get the diff:

```typescript
import { renderHtmlDiff } from "@lix-js/html-diff";
import "@lix-js/html-diff/default.css";

const tableBefore = renderTable(beforeData);
const tableAfter = renderTable(afterData);

const diff = renderHtmlDiff({
  beforeHtml: tableBefore,
  afterHtml: tableAfter,
  // Optional: use a custom attribute to match elements
  // diffAttribute: 'data-id',
});

// Vanilla render
document.getElementById("diff-container")!.innerHTML = diff;

// React render
function DiffView({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
```
