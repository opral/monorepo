import typescript from "@rollup/plugin-typescript"
import { nodeResolve } from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import injectEnvVariables from "rollup-plugin-inject-process-env"

// Retrieving the package version attribute for env variable injection.
// https://www.stefanjudis.com/snippets/how-to-import-json-files-in-es-modules-node-js/
// import { createRequire } from "module"
// const require = createRequire(import.meta.url)
// const packageVersion = require("./package.json").version

/**
 * What is rollup used for?
 *
 * Rollup bundles all dependencies into one file i.e.
 * the resulting code has no dependencies on node modules.
 * That avoids problems that can (did) occur when resolving
 * those dependencies.
 */

export default {
	input: "src/main.ts",
	output: {
		dir: "dist",
		format: "es",
	},
	plugins: [
		// nodeResolve = bundle the dependencies
		nodeResolve(),
		// typescript = compile typescript
		typescript(),
		// commonjs = because of commonjs peer dependencies (peggy.js)
		commonjs(),
		// // inject = pass env variables into the compiled code to not
		// injectEnvVariables({ PACKAGE_VERSION: packageVersion, ...env }),
	],
}
