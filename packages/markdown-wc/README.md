import: 
  - "https://example.com/doc-card.js"
  - "https://example.com/doc-button.js"


---

# Markdown with Web Components

Enables writing documentation with components in markdown as backwards compatible superset.

## Why

- Enables writing documentation with components in markdown
- Interoperable with existing markdown parsers
- Doesn't depend on a framework like [React MDX](https://mdxjs.com/) or [Svelte MDsveX](https://github.com/pngwn/MDsveX)
- Doesn't introduce custom syntax like [Markdoc](https://markdoc.dev/)

## Comparison

| Feature                        | Markdown | @opral/markdown-wc | React MDX | Svelte MDsveX | Markdoc |
|--------------------------------|----------|--------------------|-----------|---------------|---------|
| Components in markdown         | ❌       | ✅                 | ✅        | ✅             | ✅      |
| Interoperable                  | ✅       | ✅                 | ❌        | ❌             | ✅      |
| Portable                       | ✅       | ✅                 | ❌        | ❌             | ✅      |
| No custom syntax               | ✅       | ✅                 | ❌        | ❌             | ❌      |


## Usage

```ts
import { parse } from '@opral/markdown-wc';

const markdown = `

# Hello World

// This is a web component
<doc-card>
  <h1>Card Title</h1>
  <p>Card content</p>
</doc-card>
`;

// Parse markdown
const parsed = parse(markdown);

// Register web components
for (const name in parsed.imports) {
  // optionally sanitize the components here
  const component = await import(parsed.imports[name])
  customElements.define(name, component);
}

// render HTML
render(parsed.html);
```

