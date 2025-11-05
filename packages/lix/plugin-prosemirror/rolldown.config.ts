import { defineConfig } from "rolldown";
import { dts } from "rolldown-plugin-dts";

export default defineConfig([
	{
		input: "src/index.ts",
		treeshake: true,
		plugins: [dts()],
		output: {
			dir: "dist",
			format: "esm",
			sourcemap: true,
			inlineDynamicImports: true,
			minify: false,
		},
	},
]);
