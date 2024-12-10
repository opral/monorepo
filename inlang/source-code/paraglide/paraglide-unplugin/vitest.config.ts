import { defineConfig } from "vitest/config"
import { createVitePlugin } from "unplugin"
import { paraglide } from "./src/index"
import { virtual } from "./src/virtual"

const virtualPlugin = createVitePlugin(virtual)

export default defineConfig({
	test: {
		exclude: [],
		include: ["src/**/*.test.ts"],
	},
	plugins: [
		virtualPlugin({
			name: "$virtual",
			getModule(path) {
				const files = {
					"file1.js": "export { default } from './file2.js'",
					"file2.js": "export default true",
				}
				return files[path]
			},
		}),
		// set up the vite plugin
		// this is used to test the virtual modules in `e2e.test.ts`

		// @ts-ignore - vite plugin types are notoriously fragile
		paraglide.vite({
			silent: true,
			project: "./project.inlang",
			experimentalUseVirtualModules: true,
			outdir: ".",
		}),
	],
})
