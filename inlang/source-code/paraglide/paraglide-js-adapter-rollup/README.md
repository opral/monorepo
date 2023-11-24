# Paraglide Adapter Rollup

This package provides a Rollup plugin to make it easier to use the paraglide-js.

It automatically runs the compiler on build, removing the
need for the `paraglide` commands in your `package.json`.

[Learn more about Paraglide](https://github.com/inlang/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js)

## Usage
After having set up paraglide-js, you can add this plugin to your rollup config.

```js
// rollup.config.js
import { paraglide } from "@inlang/paraglide-js-adapter-rollup"
export default {
	plugins: [
		paraglide({
			project: "./inlang.project.json", //Path to your inlang project file
			outDir: "./src/paraglide", //Where you want the generated files to be placed
		}),
	]
}
```
