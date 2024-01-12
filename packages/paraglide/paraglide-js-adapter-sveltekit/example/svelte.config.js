import adapter from "@sveltejs/adapter-static"
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte"
import { mdsvex } from "mdsvex"

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [
		vitePreprocess(),
		mdsvex({
			extension: ".svx",
		}),
	],
	kit: {
		adapter: adapter(),

		alias: {
			$paraglide: "./src/paraglide/",
			$lib: "./src/lib/",
		},
	},

	extensions: [".svelte", ".svx"],
}

export default config
