---
title: What is Lix?
---

# Lix in a nutshell

Lix is a local-first change engine for structured content. It stores files
under version control and lets you query changes with plain SQL.

## Why Lix

- Track full files or fine‑grained structures
- Query history and diffs with SQL
- Works offline using OPFS in the browser

> Lix focuses on deterministic, local-first workflows. Cloud sync is optional,
> not required.

### Core ideas

1. Files are versioned by default
2. Changes are immutable and queryable
3. Plugins add content-aware behavior (e.g. Markdown, JSON)

```ts
// Insert a file
await lix.db
	.insertInto("file")
	.values({ path: "/hello.md", data: new TextEncoder().encode("Hello") })
	.execute();
```

Learn more at [github.com/opral](https://github.com/opral).
