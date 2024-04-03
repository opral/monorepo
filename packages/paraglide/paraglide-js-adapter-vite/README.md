# Paraglide Adapter Vite

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

Install the vite adapter with

```bash
npm install @inlang/paraglide-js-adapter-vite
```

and add it to your `vite.config.js`

```js
import { defineConfig } from "vite"
import { paraglide } from "@inlang/paraglide-js-adapter-vite"

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

You can find an example vite project [here](https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-vite/example).
