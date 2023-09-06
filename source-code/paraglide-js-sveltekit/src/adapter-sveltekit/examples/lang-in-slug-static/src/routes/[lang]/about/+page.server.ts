import { initServerLoadWrapper } from "@inlang/paraglide-js-sveltekit/adapter-sveltekit/server"
import type { PageServerLoad } from "./$types.js"

export const load = initServerLoadWrapper<PageServerLoad>().use(async (_, { i }) => {
	console.info("[lang]/about/+page.server.ts", i("welcome"))
})
