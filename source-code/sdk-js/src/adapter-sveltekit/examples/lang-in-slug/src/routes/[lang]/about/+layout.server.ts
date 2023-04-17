import { initServerLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/server"
import type { LayoutServerLoad } from "./$types.js"

export const load = initServerLoadWrapper<LayoutServerLoad>()
	.wrap(async (_, { i }) => {
		console.info("[lang]/about/+layout.server.ts", i("welcome"))
	})
