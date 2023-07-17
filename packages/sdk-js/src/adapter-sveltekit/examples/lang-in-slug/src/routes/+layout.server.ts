import { initRootLayoutServerLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/server"
import type { LayoutServerLoad } from "./$types.js"

export const load = initRootLayoutServerLoadWrapper<LayoutServerLoad>().use(
	async ({ params }, { i }) => {
		console.info("+layout.server.ts", i("welcome"))

		// to retrigger load function when language changes e.g. due to a popstate event
		params.lang

		return { "+layout.server.ts": Math.random() }
	},
)
