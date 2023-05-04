---
title: Environment
href: /documentation/inlang-environment
description: Learn more about the inlang environment.
---

# {% $frontmatter.title %}

**The inlang environment contains functions that are injected by the host application (e.g. the browser or VSCode).**

These functions are prefixed with a `$` to distinguish them from user-defined functions. The inlang environment is required because functions such as `import()` behave differently from environment to environment (NodeJS, Browser, VSCode, Electron).

## API

`$fs`: Read and write files from the filesystem.

The filesystem is a subset of `node:fs/promises`, asynchronous only and supports the following functions:

- `readFile`
- `writeFile`
- `readdir`
- `mkdir`

```ts
const file = await env.$fs.readFile("path/to/file.txt", { encoding: "utf-8" })
```

## import()

`$import`: Importing an ES module either from a local path in a git repository or from a url.

```ts
const module = await env.$import("https://cdn.jsdelivr.net/gh/inlang/ecosystem/plugin.js")
```

{% Callout variant="warning" %}

**Importing external code via `$import` is a security risk.**

Imported code is not sandboxed yet. Only `$import` external code that you trust (similar to NPM packages). See [#129](https://github.com/inlang/inlang/pull/129) for more information.

{% /Callout %}
