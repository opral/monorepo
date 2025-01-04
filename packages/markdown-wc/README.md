---
imports: 
  - ./dist/walking-dinosaur.js

---

# Opral Markdown WC 

Enables writing documentation with web components in markdown.

```markdown
---
imports: 
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc/dist/walking-dinosaur.js
---

# Opral Markdown WC 

Enables writing documentation with web components in markdown.

<walking-dinosaur></walking-dinosaur>
```

<walking-dinosaur></walking-dinosaur>

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


## Usage in browser 

The `<markdown-wc-embed>` element can be used to embed markdown-wc in a webpage.

```html
  <script type="module" src="https://cdn.jsdelivr.net/npm/@opral/markdown-wc/dist/markdown-wc-embed.js"></script>
  <body>
    <markdown-wc-embed src="https://my-markdown-url.com/markdown.md"></markdown-wc-embed>
  </body>
```

## Usage in markdown-wc

The `<markdown-wc-embed>` element can be used to embed markdown-wc in markdown-wc.

```markdown
---
imports:
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc/dist/markdown-wc-embed.js
---

# Hello World

<markdown-wc-embed src="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/packages/markdown-wc/README.md"></markdown-wc-embed>
```

## Usage as libary

Enables SSR and more control over the rendering process.

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
for (const url of parsed.frontmatter.imports ?? []) {
  // optionally sanitize the imported imported here
  // by, for example, only trusting a specific domain
  await import(url)
}

// render HTML
render(parsed.html);
```

## Limitations

- sanitzation of markdown as well as custom elements is not implemented atm
- SSR is DIY atm (use the `parse` function and SSR the markdown with [lit for example](https://lit.dev/docs/ssr/overview/)) 