import { nodeResolve } from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"

export default {
	// taking the compiled output from typescript to avoid duplicate
	// typescript compilation. this entails that the tsc build needs
	// to run before the bundle build runs.
	input: "dist/index.js",
	output: {
		file: "dist/bundled/index.js",
		format: "es",
	},
	preserveEntrySignatures: false,
	plugins: [commonjs(), nodeResolve()],
}
