import { initLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/shared"
import type { LayoutLoad } from "./$types.js"

export const load = initLoadWrapper<LayoutLoad>()
	.wrap(async (_, runtime) => {
		console.info("about/+layout.ts", runtime.i("welcome"))
	})
