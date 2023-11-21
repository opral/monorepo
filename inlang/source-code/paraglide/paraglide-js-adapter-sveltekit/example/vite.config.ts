import { sveltekit } from '@sveltejs/kit/vite';
import { paraglide } from "@inlang/paraglide-js-adapter-unplugin"
import { defineConfig } from "vite"

export default defineConfig({
	plugins: [
		sveltekit(),
		paraglide.vite({
			project: "./project.inlang.json",
			outdir: "./src/paraglide",
		}),
	],
	// for easier debugging, don't minify
	build: {
		minify: false,
	},
})
