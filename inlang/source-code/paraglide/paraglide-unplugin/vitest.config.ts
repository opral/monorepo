/// <reference types="vitest" />
import { defineConfig } from "vitest/config"
import { paraglide } from "./src/index"

export default defineConfig({
	test: {
		exclude: [],
	},
	plugins: [
		// set up the vite plugin
		// this is used to test the virtual modules in `e2e.test.ts`

		// @ts-ignore - vite plugin types are notoriously fragile
		paraglide.vite({
			silent: true,
			project: "./project.inlang",
			useVirtualModule: true,
		}),
	],
})
