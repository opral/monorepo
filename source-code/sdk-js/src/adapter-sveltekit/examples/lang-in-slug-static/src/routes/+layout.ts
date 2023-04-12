import { setInlangPayload } from "@inlang/sdk-js/adapter-sveltekit/shared"
import { initI18nRuntime } from "@inlang/sdk-js/adapter-sveltekit/client"

import type { LayoutLoad } from "./$types.js"

export const load = (async ({ data, fetch }) => {
	const runtime = await initI18nRuntime({
		fetch,
		language: data.language,
		referenceLanguage: data.referenceLanguage,
		languages: data.languages,
	})

	const i = runtime.getInlangFunction()
	console.info("+layout.ts", i("welcome"))

	return { ...(data || {}), "+layout.ts": Math.random(), ...setInlangPayload(runtime) }
}) satisfies LayoutLoad
