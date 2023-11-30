import adapter from "@sveltejs/adapter-static"
import { vitePreprocess } from "@sveltejs/kit/vite"
import { preprocess } from "@inlang/paraglide-js-adapter-sveltekit"

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess(), preprocess()],
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
}

export default config
