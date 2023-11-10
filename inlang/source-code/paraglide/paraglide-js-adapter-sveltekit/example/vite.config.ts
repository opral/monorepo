import { sveltekit } from '@sveltejs/kit/vite';
import { i18n } from "@inlang/paraglide-js/vite"
import { defineConfig } from "vite"

export default defineConfig({
	plugins: [
		sveltekit(),
		i18n({
			outdir: "./src/paraglide",
			project: "./project.inlang.json",
		}),
	],
	// for easier debugging, don't minify
	build: {
		minify: false,
	},
})
