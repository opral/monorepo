import { setRuntimeToData } from "@inlang/sdk-js/adapter-sveltekit/shared"
import { initSvelteKitClientRuntime } from "@inlang/sdk-js/adapter-sveltekit/client"

import type { LayoutLoad } from "./$types.js"

export const load = (async ({ data, fetch }) => {
	const runtime = await initSvelteKitClientRuntime({
		fetch,
		language: data.language!,
		referenceLanguage: data.referenceLanguage,
		languages: data.languages,
	})

	const i = runtime.getInlangFunction()
	console.info("+layout.ts", i("welcome"))

	return setRuntimeToData({ ...data, "+layout.ts": Math.random() }, runtime)
}) satisfies LayoutLoad
