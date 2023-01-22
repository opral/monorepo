---
title: Build apps on inlang
href: /documentation/build-on-inlang
description: Learn how to build on top of inlang.
---

# {% $frontmatter.title %}

**Inlang is designed to build upon with the `@inlang/core` package.**

The [@inlang/core](https://github.com/inlang/inlang/tree/main/source-code/core) package is all one needs to build an app, a GitHub action, a CLI, an SDK, and more. All inlang apps themselves use the `@inlang/core` package.

{% Callout variant="info" %}

**The documentation is work in progress.** Reach out via [discussions](https://github.com/inlang/inlang/discussions) or email `hello@inlang.com` if you have questions.

{% /Callout %}

## Example

The following is a script that demonstrates how you can build on top of inlang. The script validates messages in resources.

```js
// filename: example-script.js

import fs from "node:fs/promises";
import { query } from "@inlang/core/query";
import { initialize$import } from "@inlang/core/config";
import { defineConfig } from "./inlang.config.js";

// initializing the environment functions
const env = {
  $import: initialize$import({
    workingDirectory: "/example",
    fs: $fs,
    fetch,
  }),
  $fs: fs,
};

// the `defineConfig` function is directly imported from `./inlang.config.js`
const config = await defineConfig(env);

// the config gives access to readingResources and more
const resources = await config.readResources({ config });

// --- validate resources according to your logic ---
//
// the example below checks if "first-message" exsits in all resources
for (const resource of resources) {
  const message = query(resource).get({ id: "first-message" });
  if (message === undefined) {
    throw Error("The message must be defined");
  }
}
```
