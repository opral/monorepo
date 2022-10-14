import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

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
		dir: "dist",
		format: "cjs",
	},
	plugins: [
		// nodeResolve = bundle the dependencies
		nodeResolve(),
		// typescript = compile typescript
		typescript(),
		// commonjs = because of commonjs peer dependencies (peggy.js)
		commonjs(),
	],
};
