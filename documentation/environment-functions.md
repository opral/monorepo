---
title: Environment functions
href: /documentation/environment-functions
description: Learn more about environment functions.
---

# {% $frontmatter.title %}

**The config can make use of environment functions, denoted by a prefixed `$`, to call read from the filesystem, import external code, and more.**

Inlang's config is executed in a variety of environments such as the browser, [NodeJS](https://nodejs.org/en/), or [Electron](https://www.electronjs.org/). Unfortunately, functions such as `import()` behave differently from environment to environment. Environment functions assure consistent behaviour across different environments.

## Reference

Always up-to-date reference can be found [in the repository](https://github.com/inlang/inlang/tree/main/source-code/core/src/config/environment-functions).

`$fs`: **memfs/promises**

Mirrors node:fs/promises. If TypeScript complains, ignore the type error. The type error bug is tracked in [#154](https://github.com/inlang/inlang/issues/154).

`$import`: **dynamic import()**

{% Callout variant="warning" %}

**Importing external code via `$import` is a security risk.**

Imported code is not sandboxed yet. Only `$import` external code that you trust (similar to NPM packages). See [#129](https://github.com/inlang/inlang/pull/129) for more information.

{% /Callout %}

Importing an ES module either from a local path in a git repository or from a url. Note that the imported module must not have imports itself. If dependencies are required for a module, the module needs to be bundled into one single file. For an example of bundling, take a look at the [official plugin template](https://github.com/inlang/plugin-template).

```ts
$import("https://cdn.jsdelivr.net/gh/inlang/ecosystem/plugin.js");
```
