import { initLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/shared"
import type { PageLoad } from "./$types.js"

export const load = initLoadWrapper<PageLoad>()
	.wrap(async (_, runtime) => {
		console.info("+page.ts", runtime.i("welcome"))
	})
