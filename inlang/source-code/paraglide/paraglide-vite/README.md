---
imports: 
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-callout.js
---


<doc-callout type="warning">
  Paraglide JS 2.0 bundles the vite plugin. Please use the [Paraglide JS 2.0](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/vite) instead.
</doc-callout>

Paraglide JS 2.0 bundles the vite plugin. Please use the [Paraglide JS 2.0](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/vite) instead.

This package provides a vite plugin to make it easier to use paraglide-js in any project that uses vite.

It automatically runs the compiler on message changes, giving you a seamless experience.
You also no longer need the `paraglide` commands in your `package.json`.

[Learn more about Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs)

## Usage

First make sure you have set up `@inlang/paraglide-js`. If you haven't you can get started by running
this command and following the instructions.

```bash
npx @inlang/paraglide-js init
```

Install paraglide-vite with

```bash
npm install @inlang/paraglide-vite
```

and add it to your `vite.config.js`

```js
import { defineConfig } from "vite"
import { paraglide } from "@inlang/paraglide-vite"

export default defineConfig({
  plugins: [
    paraglide({
      project: "./project.inlang", //Path to your inlang project
      outdir: "./src/paraglide", //Where you want the generated files to be placed
    }),
  ],
})
```

Now, the `paraglide` folder at `./src/paraglide` will be automatically updated when you change your messages.

## Example

You can find an example vite project [here](https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-vite/example).
