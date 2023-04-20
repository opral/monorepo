// import adapter from "@sveltejs/adapter-auto"
import adapter from "@sveltejs/adapter-static"
import { inlangPreprocess } from "@inlang/sdk-js/adapter-sveltekit"

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [inlangPreprocess],
	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter(),
	},
}

export default config
