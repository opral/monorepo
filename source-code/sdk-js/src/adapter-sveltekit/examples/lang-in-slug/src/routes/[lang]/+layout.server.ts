import { initServerLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/server"
import type { LayoutServerLoad } from "./$types.js"

export const load = initServerLoadWrapper<LayoutServerLoad>().use(async (_, { i }) => {
	console.info("[lang]/+layout.server.ts", i("welcome"))
})
