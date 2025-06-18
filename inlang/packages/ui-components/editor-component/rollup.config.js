/* eslint-disable no-undef */
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import json from "@rollup/plugin-json";

export default {
	// taking the compiled output from typescript to avoid duplicate
	// typescript compilation. this entails that the tsc build needs
	// to run before the bundle build runs.
	input: "dist/index.js",
	output: {
		file: "dist/bundled/index.js",
		format: "es",
	},
	onwarn: function (message, next) {
		// if dependencies have circular dependencies, we can't do nothing about it
		if (message.code === "CIRCULAR_DEPENDENCY") {
			return;
		}
		// typescript compiles experimental decorators with this
		// the component works regardless. hence, surpressing this warning
		else if (message.code === "THIS_IS_UNDEFINED") {
			return;
		}
		next(message);
	},
	preserveEntrySignatures: false,
	plugins: [
		commonjs(),
		nodeResolve(),
		json(),
		replace({
			preventAssignment: true,
			// this is to ensure that the production build of lexical is used
			"process.env.NODE_ENV": JSON.stringify("production"),
		}),
	],
};
