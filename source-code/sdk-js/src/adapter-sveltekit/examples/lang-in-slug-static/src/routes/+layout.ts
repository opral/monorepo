import { initI18nRuntime, inlangSymbol } from "../inlang.js"
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

	return { ...(data || {}), "+layout.ts": Math.random(), [inlangSymbol]: runtime }
}) satisfies LayoutLoad
