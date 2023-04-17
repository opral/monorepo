import { initRootServerLayoutLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/server"
import type { LayoutServerLoad } from "./$types.js"

export const load = initRootServerLayoutLoadWrapper<LayoutServerLoad>().wrap(async (_, { i }) => {
	console.info("+layout.server.ts", i("welcome"))

	return { "+layout.server.ts": Math.random() }
})
