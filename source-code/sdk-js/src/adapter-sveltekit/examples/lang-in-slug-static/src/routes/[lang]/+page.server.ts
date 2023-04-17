import { initServerLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/server"
import type { PageServerLoad } from "./$types.js"

export const load = initServerLoadWrapper<PageServerLoad>()
	.wrap(async (_, { i }) => {
		console.info("[lang]/+page.server.ts", i("welcome"))
	})
