import { sveltekit } from '@sveltejs/kit/vite';
import { paraglideJsVitePlugin } from "@inlang/paraglide-js"
import { defineConfig } from "vite"

export default defineConfig({
	plugins: [
		sveltekit(),
		paraglideJsVitePlugin({
			namespace: "sveltekit",
			settingsPath: "./project.inlang.json",
		}),
	],
	// for easier debugging, don't minify
	build: {
		minify: false,
	},
})
