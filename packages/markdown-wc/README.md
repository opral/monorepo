# Markdown with Web Components

Enables writing documentation with components in markdown as backwards compatible superset.

## Why

- Enables writing documentation with components in markdown
- Uses only HTML and Frontmatter to be backwards compatible with markdown
- Doesn't depend on a framework like [React MDX](https://mdxjs.com/) or [Svelte MDsveX](https://github.com/pngwn/MDsveX)

## Comparison

| Feature                        | Markdown | @opral/markdown-wc | React MDX | Svelte MDsveX | Markdoc |
|--------------------------------|----------|--------------------|-----------|---------------|---------|
| Components in markdown         | ❌       | ✅                 | ✅        | ✅            | ✅      |
| Interoperable                  | ✅       | ✅                 | ❌        | ❌            | ✅      |
| Doesn't depend on a framework  | ✅       | ✅                 | ❌        | ❌            | ✅      |


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

const html = parse(markdown);

console.log(html);
```