import { sveltekit } from "@sveltejs/kit/vite"
import { paraglide } from "@inlang/paraglide-js-adapter-sveltekit/plugin"
import { defineConfig } from "vite"

export default defineConfig({
	plugins: [
		paraglide({
			project: "./project.inlang",
			outdir: "./src/paraglide",

			routingStrategy: {
				name: "prefix",
				prefixDefault: false,
			},

			exclude: [new RegExp("^/api"), new RegExp("^/not-translated")],
		}),
		sveltekit(),
	],
})
