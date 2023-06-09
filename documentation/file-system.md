---
title: File system
href: /documentation/file-system
description: Everything about the minimal internal file system
---

# {% $frontmatter.title %}

**Inlang manipulates files in different contexts. For example, there is the editor which runs in the browser and the ide-extension, which is a VSCode extension. Inside inlangs core is a minimal file system, which intersects with `node:fs` and `memfs`.**

Currently the file system supports the following operations:

- `readFile`: For reading resource files or the `inlang.config.js`.
- `writeFile`: For saving new versions of resource files.
- `readdir`: To find out about existing resource files in the same folder.

The file system is asynchronous only.

{% Feedback /%}
