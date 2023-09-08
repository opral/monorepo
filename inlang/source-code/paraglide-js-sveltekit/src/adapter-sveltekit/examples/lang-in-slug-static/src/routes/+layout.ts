import { initRootLayoutLoadWrapper } from "@inlang/paraglide-js-sveltekit/adapter-sveltekit/shared"
import type { LayoutLoad } from "./$types.js"

export const load = initRootLayoutLoadWrapper<LayoutLoad>({}).use(async ({ data }, { i }) => {
	console.info("+layout.ts", i("welcome"))

	return { ...data, "+layout.ts": Math.random() }
})
