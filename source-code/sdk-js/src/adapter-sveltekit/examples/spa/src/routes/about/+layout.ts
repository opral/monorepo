import { initLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/shared"
import type { LayoutLoad } from "./$types.js"

export const load = initLoadWrapper<LayoutLoad>().use(async (_, { i }) => {
	console.info("about/+layout.ts", i("welcome"))
})
