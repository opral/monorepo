# Paraglide Adapter Vite

This package provides a vite plugin to make it easier to use paraglide-js in any project that uses vite.

It automatically runs the compiler on message changes, giving you a seamless experience.
You also no longer need the `paraglide` commands in your `package.json`.

[Learn more about Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs)

## Usage

After having set up paraglide-js, you can add this plugin to your vite config.

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
}
```

Now, the `paraglide` folder at `./src/paraglide` will be automatically updated when you change your messages.


### Setting up an Alias

Since you'll be importing from the `paraglide` folder a lot, it's a good idea to set up an alias for it. This way you won't have to write `../../paraglide` all the time.

In your `vite.config.js`:

```js
import { defineConfig } from "vite"
import { paraglide } from "@inlang/paraglide-js-adapter-vite"
import path from "path"

export default defineConfig({
	plugins: [
		paraglide({
			project: "./project.inlang",
			outdir: "./src/paraglide"
		}),
	],
	resolve: {
		alias: {
			// This is the alias you can use in your code
			// you can change it to whatever you want
			"$paraglide": path.resolve(__dirname, "src/paraglide")
		}
	}
}
```

You can now import your messages from `$paraglide/messages`. But typescript will warn that it can't find the module. To fix this, you need to add the alias to your `tsconfig.json`:

```json
{
	"compilerOptions": {
		"paths": {
			"$paraglide/*": ["./src/paraglide/*"]
		}
	}
}
```

Happy Hacking!


## Example

You can find an example vite project [here](https://github.com/inlang/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-vite/example).
