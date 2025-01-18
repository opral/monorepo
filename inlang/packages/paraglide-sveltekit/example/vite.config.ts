import { sveltekit } from "@sveltejs/kit/vite"
import { paraglide } from "@inlang/paraglide-sveltekit/vite"
import { visualizer } from "rollup-plugin-visualizer"
import { defineConfig } from "vite"

export default defineConfig({
	plugins: [
		paraglide({
			project: "./project.inlang",
			outdir: "./src/lib/paraglide",
		}),
		sveltekit(),
		visualizer({
			filename: "stats.html",
			emitFile: true,
		}),
	],
})
