import { initRootLayoutLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/shared"
import type { LayoutLoad } from "./$types.js"

export const load = initRootLayoutLoadWrapper<LayoutLoad>().wrap(async ({ data }) => {
	// const runtime = await initSvelteKitClientRuntime({
	// 	fetch,
	// 	language: data.language!,
	// 	referenceLanguage: data.referenceLanguage,
	// 	languages: data.languages,
	// })

	// console.info("+layout.ts", runtime.i("welcome"))

	return { ...data, "+layout.ts": Math.random() }
})