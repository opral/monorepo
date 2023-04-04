---
title: Getting started
href: /documentation/getting-started
description: Learn on how to get started with inlang.
---

# {% $frontmatter.title %}

One single config file named `inlang.config.js` needs to be created at the root of the git repository.
We provide you with the [@inlang/cli](https://github.com/inlang/inlang/tree/main/source-code/cli) to fully automate that, but you can also do it by hand.

If you don't use JSON in your project, check out all the other [plugins](https://github.com/inlang/ecosystem) we support.

## Using the CLI

First, open your repository folder and execute the inlang CLI on the root level:

```sh
inlang config init
```

If you don't have the [@inlang/cli](https://github.com/inlang/inlang/tree/main/source-code/cli) installed, you can get it from [here](/documentation/cli) or execute it with `npx @inlang/cli config init`

## Step-by-step for JSON files

1. Create a new file named `inlang.config.js` at the root of your git repository.
   Example:
   {% Figure
   width="w-3/4"

   src="https://user-images.githubusercontent.com/72493222/222404451-9e5cf370-5ff1-4e12-939e-135687423e70.png"

   alt="inlang config example"

/%}

1. Copie/paste the code below in the config and change the `pathPattern` into your directory structure.

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

2. Commit the config and open your project in the [inlang editor](https://inlang.com/editor)
