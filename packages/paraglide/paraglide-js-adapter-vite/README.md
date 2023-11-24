# Paraglide Adapter Vite

This package provides a vite plugin to make it easier to use paraglide-js in any Framework that uses vite.

It automatically runs the compiler on message changes, giving you a seamless experience.
You also do no longer need the `paraglide` commands in your `package.json`.

[Learn more about Paraglide](https://github.com/inlang/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js)

## Usage
After having set up paraglide-js, you can add this plugin to your webpack config.

```js
import { paraglide } from "@inlang/paraglide-js-adapter-vite"
export default {
	plugins: [
		paraglide({
			project: "./inlang.project.json", //Path to your inlang project file
			outDir: "./src/paraglide", //Where you want the generated files to be placed
		}),
	],
}
```

That's it. Happy Hacking.
