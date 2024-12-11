import { defineConfig } from "vitest/config"
import { paraglide } from "./src/index"
import path from "path"

export default defineConfig({
	test: {
		exclude: [],
		include: ["src/**/*.test.ts"],
	},
	resolve: {
		alias: {
			$paraglide: path.resolve(__dirname, "./src/outdir"),
		},
	},
	plugins: [
		// set up the vite plugin
		// this is used to test the virtual modules in `e2e.test.ts`

		// @ts-ignore - vite plugin types are notoriously fragile
		paraglide.vite({
			silent: true,
			project: "./project.inlang",
			experimentalUseVirtualModules: true,
			outdir: "./src/outdir",
		}),
	],
})
