import { initLoadWrapper } from '@inlang/sdk-js/adapter-sveltekit/shared'
import type { PageLoad } from "./$types.js"

export const load = initLoadWrapper<PageLoad>()
	.wrap(async (_, runtime) => {
		console.info("[lang]/about/+page.ts", runtime.i("welcome"))
	})
