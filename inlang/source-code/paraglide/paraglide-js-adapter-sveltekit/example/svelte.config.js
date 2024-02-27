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
		prerender: {
			//Needed for correctly prerendering <link rel="alternate" hreflang="x" href="y">
			origin: "https://example.com",
		},
	},

	extensions: [".svelte", ".svx"],
}

export default config
