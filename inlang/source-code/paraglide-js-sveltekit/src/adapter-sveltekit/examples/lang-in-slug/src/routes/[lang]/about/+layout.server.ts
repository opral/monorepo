import { initServerLoadWrapper } from "@inlang/paraglide-js-sveltekit/adapter-sveltekit/server"
import type { LayoutServerLoad } from "./$types.js"

export const load = initServerLoadWrapper<LayoutServerLoad>().use(async (_, { i }) => {
	console.info("[lang]/about/+layout.server.ts", i("welcome"))
})
