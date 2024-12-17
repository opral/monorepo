# Paraglide-Rollup

This package provides a Rollup plugin to make it easier to use the paraglide-js.

It automatically runs the compiler on build, removing the
need for the `paraglide` commands in your `package.json`.

[Learn more about Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs)

## Usage

After having set up paraglide-js, you can add this plugin to your rollup config.

```js
// rollup.config.js
import { paraglide } from "@inlang/paraglide-rollup";
export default {
  plugins: [
    paraglide({
      project: "./project.inlang", //Path to your inlang project
      outDir: "./src/paraglide", //Where you want the generated files to be placed
    }),
  ],
};
```

Now, the `paraglide` folder at `./src/paraglide` will be automatically updated when you build your project. If you combine this with a watcher, you can rebuild your project whenever you change your messages.

### Setting up an Alias

Since you'll be importing from the `paraglide` folder a lot, it's a good idea to set up an alias for it. This way you won't have to write `../../paraglide` all the time.

You can do this using the `@rollup/plugin-alias` plugin. Install it:

```bash
npm install --save-dev @rollup/plugin-alias
```

And then add it to your rollup config. This example assumes that you're using ESM.

```js
// rollup.config.js
import { paraglide } from "@inlang/paraglide-rollup";
import alias from "@rollup/plugin-alias";
import { fileURLToPath } from "url";

export default {
  plugins: [
    alias({
      entries: {
        // This is the alias you can use in your code
        // you can change it to whatever you want
        $paraglide: fileURLToPath(new URL("./src/paraglide", import.meta.url)),
      },
    }),
    paraglide({
      project: "./project.inlang",
      outdir: "./src/paraglide",
    }),
  ],
};
```

You can now import your messages from `$paraglide/messages`. But typescript will warn that it can't find the module. To fix this, you need to add the alias to your `tsconfig.json`:

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "$paraglide/*": ["src/paraglide/*"]
    }
  }
}
```

Happy Hacking.

## Example

You can find an example project [here](https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-rollup/example)
