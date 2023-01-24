---
title: Getting started
href: /documentation/getting-started
description: Learn on how to get started with inlang.
---

# {% $frontmatter.title %}

{% Callout variant="info" %}

Inlang is in public **alpha**. Read more about our breaking change policy [here](/documentation/breaking-changes).

{% /Callout %}

{% Video src="https://youtu.be/rwqJ0RygAYc" /%}

One single config file named `inlang.config.js` needs to be created at the root of the repository. The `inlang.config.js` file needs to export an `defineConfig` function that returns an object that conforms to the [config schema](https://github.com/inlang/inlang/blob/main/source-code/core/src/config/schema.ts). More often than not, you want to use a [plugin](/documentation/plugins) that defines parts of the config. Just in case, take a look at the [inlang example repository](https://github.com/inlang/example).

## Step-by-step

1. Create a new file named `inlang.config.js` in the root of your git repository.

2. The newly created file needs to export an async function called `defineConfig`.

   ```ts
   // filename: inlang.config.js

   export async function defineConfig(env) {}
   ```

3. `defineConfig` must return an object that satisfies the [config schema](https://github.com/inlang/inlang/blob/main/source-code/core/src/config/schema.ts)

   ```ts
   // filename: inlang.config.js

   export async function defineConfig(env) {
     return {
       referenceLanguage: "en",
       languages: ["en", "de"],
       readResources: (args) => {
         // define how resources should be read
       },
       writeResources: (args) => {
         // define how resources should be written
       },
     };
   }
   ```

4. In most cases, [plugins](/documentation/plugins) define parts of the config. Plugins can be imported via the `env.$import()` [environment function](/documentation/environment-functions).

   ```js
   // filename: inlang.config.js

   export async function defineConfig(env) {
     // importing a plugin
     const plugin = await env.$import(
       "https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@1.0.0/dist/index.js"
     );

     // most plugins require additional config, read the plugins documentation
     // for the required config and correct usage.
     const pluginConfig = {
       pathPattern: "./{language}.json",
     };

     return {
       referenceLanguage: "en",
       languages: ["en", "de"],
      readResources: (args) =>
      plugin.readResources({ ...args, ...env, pluginConfig }),
    writeResources: (args) =>
      plugin.writeResources({ ...args, ...env, pluginConfig }),
     };
   }
   ```

## Adding typesafety to the config

{% Callout variant="info" %}

Your codebase must use, or be able to use, `moduleResolution: "node16"`. Read [#298](https://github.com/inlang/inlang/issues/298) for more information.

{% /Callout %}

If inlang is used in a JavaScript environment like Node or Deno, typesafety can be achieved by installing [@inlang/core](https://www.npmjs.com/package/@inlang/core) and using [JSDoc](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html) in JavaScript.

1. Install `@inlang/core` as dev dependency.

   ```bash
   $ npm install @inlang/core --save-dev
   ```

2. Add the following JSDoc comment above the `defineConfig` function.

   ```js
   /**
    * @type {import("@inlang/core/config").DefineConfig}
    */
   export async function defineConfig(env) {
     //
     //
     //
   }
   ```

3. Add `checkJs: true` and `moduleResolution: node16` to your `tsconfig.json`.

   ```js
   compilerOptions: {
     // ...
     checkJs: true;
     moduleResolution: "node16";
   }
   ```
