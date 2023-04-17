import { initRootLayoutLoadWrapper } from '@inlang/sdk-js/adapter-sveltekit/shared'
import type { LayoutLoad } from "./$types.js"

export const load = initRootLayoutLoadWrapper<LayoutLoad>({

}).wrap(({ data }) => {
	// const data = await parent()
	// const runtime = getRuntimeFromData(data)
	// console.info("+layout.ts", runtime.i("welcome"))

	return { ...data, "+layout.ts": Math.random() }
})
