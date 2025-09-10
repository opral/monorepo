import { defineConfig } from "rolldown";

// Single-file modern ESM bundle suitable for dynamic import as a string.
// Target modern browsers; inline dynamic imports to keep it self-contained.
export default defineConfig({
	// Bundle the TypeScript-emitted JS to ensure decorators are already transformed.
	input: "dist/index.js",
	platform: "browser",
	treeshake: true,
	output: {
		file: "dist/index.bundle.js",
		format: "esm",
		inlineDynamicImports: true,
		minify: false,
	},
});
