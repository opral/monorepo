import preserveDirectives from "rollup-preserve-directives"
import typescript from "@rollup/plugin-typescript"
import { defineConfig } from "rollup"
import peerDepsExternalImport from "rollup-plugin-peer-deps-external"

const peerDepsExternal = /** @type {any}*/ (peerDepsExternalImport)

export default defineConfig({
	plugins: [typescript({ tsconfig: "./tsconfig.json" }), peerDepsExternal(), preserveDirectives()],
	input: {
		index: "src/index.tsx",
		"plugin/index": "src/plugin/index.ts",
		"pages/index": "src/pages/index.tsx",
		middleware: "src/middleware.ts",
	},
	output: [
		{
			preserveModules: true,
			format: "cjs",
			entryFileNames: "[name].js",
			dir: "dist",
		},
		{
			preserveModules: true,
			format: "es",
			entryFileNames: "[name].mjs",
			dir: "dist",
		},
	],
	external: [
		/node_modules/,
		"$paraglide-adapter-next-internal/runtime.js",
		"path",
		"url",
		"fs/promises",
	],
})
