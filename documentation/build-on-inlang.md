---
title: Build apps on inlang
href: /documentation/build-on-inlang
description: Learn how to build your own inlang app.
---

# {% $frontmatter.title %}

## Introduction

Inlang is designed to be build upon. The [@inlang/core](https://github.com/inlang/inlang/tree/main/source-code/core) module provides everything one needs to build apps, GitHub actions, and more.

{% Callout variant="info" %}

**The documentation is work in progress.** Reach out via [discussions](https://github.com/inlang/inlang/discussions) or email `hello@inlang.com` if you have questions.

{% /Callout %}

If you build on inlang, the "logic" usually resembles the following flow:

> config.readResources() -> query(AST) -> config.writeResources()

```js
// The `inlang.config.js` file can be imported by your application
const { defineConfig } = await import("./inlang.config.js")
const config = defineConfig(/** arguments */)

// get the resources (AST)
let resources = config.readResources(/** arguments */)

// modify the resources with @inlang/core/query
resources = query(resources).delete({ id: "outdated-message" })
resources = query(resources).update({ id: "hello", with: "Hello from inlang" })

// write the resources to the filesystem
config.writeResources(resources)
```

## Example

The following is a script that demonstrates how you can build on top of inlang. The script validates messages in resources.

```js
// filename: example-script.js

import fs from "node:fs/promises"
import { query } from "@inlang/core/query"
import { initialize$import } from "@inlang/core/config"
import { defineConfig } from "./inlang.config.js"

// initializing the environment functions
const env = {
	$import: initialize$import({
		fs: $fs,
		fetch,
	}),
	$fs: fs,
}

// the `defineConfig` function is directly imported from `./inlang.config.js`
const config = await defineConfig(env)

// the config gives access to readingResources and more
const resources = await config.readResources({ config })

// --- validate resources according to your logic ---
//
// the example below checks if "first-message" exists in all resources
for (const resource of resources) {
	const message = query(resource).get({ id: "first-message" })
	if (message === undefined) {
		throw Error("The message must be defined")
	}
}
```
