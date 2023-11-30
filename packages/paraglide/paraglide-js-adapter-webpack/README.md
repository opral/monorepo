# Paraglide Adapter Webpack

This package provides a Webpack plugin to make paraglide easier to use.

It automatically runs the compiler when building, so you no longer need the `paraglide` commands in your `package.json`.

[Learn more about Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs)

## Usage

After having set up paraglide-js, you can add this plugin to your webpack config.

```js
import Paraglide from "@inlang/paraglide-js-adapter-webpack"

export default {
	plugins: [
		Paraglide({
			project: "./project.inlang",
			outdir: "./src/paraglide",
		}),
	],
}
```

This will run the compiler when webpack builds your project. This will ensure that the generated files in `./src/paraglide` are always up to date.

## Setting up an Alias

Since you will be importing from the `paraglide` folder a lot, it's a good idea to set up an alias for it. This way you won't have to write `../../paraglide` all the time.

In your `webpack.config.js`, add an alias to your `resolve` object:

```js
import { paraglide } from "@inlang/paraglide-js-adapter-webpack"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default {
	resolve: {
		alias: {
			$paraglide: path.resolve(__dirname, "src/paraglide/"),
		},
	},
	plugins: [
		paraglide({
			project: "./project.inlang",
			outdir: "./src/paraglide",
		}),
	],
}
```

You can now import your messages from `$paraglide/messages`. But typescript will warn that it can't find the module. To fix this, you need to add the alias to your `tsconfig.json`:

```json
{
	"compilerOptions": {
		"baseUrl": ".",
		"paths": {
			"$paraglide/*": ["src/paraglide/*"]
		}
	}
}
```

That's it. Happy Hacking.
