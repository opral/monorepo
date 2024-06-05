import adapter from "@sveltejs/adapter-node"
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte"

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess()],
	kit: {
		adapter: adapter(),
		prerender: {
			//Needed for correctly prerendering <link rel="alternate" hreflang="x" href="y">
			origin: "https://example.com",
		},
	},

	extensions: [".svelte", ".svx"],
}

export default config
