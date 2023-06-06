---
title: Quick start
href: /documentation/quick-start
description: This is the description foe thw quickstart guide
---

# {% $frontmatter.title %}

An `inlang.config.js` needs to be created at the root of your git repository.

### Using the CLI

Open your repository and execute the inlang CLI on the root level:

```
npx @inlang/cli@latest config init
```

### Manual step-by-step guide

1.  Create a new file named `inlang.config.js` at the root of your git repository.
2.  Select a [plugin](https://github.com/inlang/ecosystem) and import it in the config:

    ```js
    // filename: inlang.config.js

    export async function defineConfig(env) {
    	const { default: pluginJson } = await env.$import(
    		"https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@2/dist/index.js",
    	)

    	return {
    		referenceLanguage: "en",
    		plugins: [
    			pluginJson({
    				pathPattern: ".example/{language}.json",
    			}),
    		],
    	}
    }
    ```

3.  Commit the config and open the repository in the [inlang editor](https://inlang.com/editor)
