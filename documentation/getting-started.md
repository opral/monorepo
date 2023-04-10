---
title: Getting started
href: /documentation/getting-started
description: Learn on how to get started with inlang.
---

# {% $frontmatter.title %}

An `inlang.config.js` needs to be created at the root of your git repository.

### Using the CLI

Open your repository and execute the inlang CLI on the root level:

```
npx @inlang/cli config init
```

### Manual step-by-step guide

_If you don't use JSON files in your project, check out other other [plugins](https://github.com/inlang/ecosystem)._

1. Create a new file named `inlang.config.js` at the root of your git repository.
   {% Figure
      width="w-3/4"
      src="https://user-images.githubusercontent.com/72493222/222404451-9e5cf370-5ff1-4e12-939e-135687423e70.png"
      alt="inlang config example"
   /%}

2. Copy and paste the code below in the config and change the `pathPattern` into your directory structure.

   ```js
   // filename: inlang.config.js

   export async function defineConfig(env) {
   	// importing the json plugin
   	const plugin = await env.$import(
   		"https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@1/dist/index.js",
   	)

   	const pluginConfig = {
   		pathPattern: ".example/{language}.json",
   	}

   	return {
   		referenceLanguage: "en",
   		languages: await plugin.getLanguages({
   			...env,
   			pluginConfig,
   		}),
   		readResources: (args) => plugin.readResources({ ...args, ...env, pluginConfig }),
   		writeResources: (args) => plugin.writeResources({ ...args, ...env, pluginConfig }),
   	}
   }
   ```

3. Commit the config and open your project in the [inlang editor](https://inlang.com/editor)
