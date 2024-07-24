import { defineConfig } from "vite"
import topLevelAwait from "vite-plugin-top-level-await"
import { nodePolyfills } from "vite-plugin-node-polyfills"

export default defineConfig({
	plugins: [
		// required to support top level await
		topLevelAwait(),
		nodePolyfills({
			// include: ["path", "stream", "util"],
			// exclude: ["http"],
			// globals: {
			// 	Buffer: true,
			// 	global: true,
			// 	process: true,
			// },
			// overrides: {
			// 	fs: "memfs",
			// },
			protocolImports: true,
		}),
	],
	server: {
		headers: {
			"Cross-Origin-Opener-Policy": "same-origin",
			"Cross-Origin-Embedder-Policy": "require-corp",
		},
	},
	optimizeDeps: {
		exclude: ["@sqlite.org/sqlite-wasm", "sqlocal"],
	},
})
