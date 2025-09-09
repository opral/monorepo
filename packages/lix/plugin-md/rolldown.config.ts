import { defineConfig } from "rolldown";

// Single-file modern ESM bundle suitable for dynamic import as a string.
// Target modern browsers; inline dynamic imports to keep it self-contained.
export default defineConfig({
	input: "src/index.ts",
	platform: "browser",
	treeshake: true,
	output: {
		file: "dist/plugin.bundle.js",
		format: "esm",
		inlineDynamicImports: true,
		minify: false,
	},
});
