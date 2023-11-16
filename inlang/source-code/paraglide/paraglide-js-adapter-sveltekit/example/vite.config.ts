import { sveltekit } from '@sveltejs/kit/vite';
import { vitePlugin } from "@inlang/paraglide-js"
import { defineConfig } from "vite"

export default defineConfig({
	plugins: [
		sveltekit(),
		vitePlugin({
			outdir: "./src/paraglide",
			project: "./project.inlang.json",
		}),
	],
	// for easier debugging, don't minify
	build: {
		minify: false,
	},
})
