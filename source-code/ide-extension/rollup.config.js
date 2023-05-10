import { nodeResolve } from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import typescript from "@rollup/plugin-typescript"
import json from "@rollup/plugin-json"

/**
 * What is rollup used for?
 *
 * Inlang packages are ES Modules. VSCode only supports CJS (CommonJS modules).
 * Rollup is used to compile the ESM code to CJS.
 */
export default {
	input: "src/main.ts",
	output: {
		sourcemap: true,
		// .cjs because the package.json defines "type": "module",
		// .cjs indicates that the file should not be treated as es module
		// but commonjs instead
		dir: "dist/",
		entryFileNames: "[name].cjs",
		chunkFileNames: "[name]-[hash].cjs",
		format: "cjs",
	},
	// the vscode dependency is provided by vscode.
	external: ["vscode"],
	plugins: [
		// nodeResolve = bundle the dependencies
		nodeResolve({
			preferBuiltins: true,
		}),
		// typescript = compile typescript
		typescript(),
		json(),
		commonjs(),
	],
}
