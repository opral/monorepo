import adapter from "@sveltejs/adapter-static"
import { vitePreprocess } from "@sveltejs/kit/vite"
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
		},

		// Need for crawling to work until
		// https://github.com/sveltejs/kit/issues/11133
		// is fixed
		prerender: {
			entries: ["/"],
		},
	},

	extensions: [".svelte", ".svx"],
}

export default config
