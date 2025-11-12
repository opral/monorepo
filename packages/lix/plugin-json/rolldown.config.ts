import { defineConfig } from "rolldown";
import { dts } from "rolldown-plugin-dts";

export default defineConfig([
	{
		input: "src/index.ts",
		treeshake: true,
		plugins: [dts()],
		output: {
			sourcemap: true,
			dir: "dist",
			format: "esm",
			inlineDynamicImports: true,
			minify: false,
		},
	},
]);

