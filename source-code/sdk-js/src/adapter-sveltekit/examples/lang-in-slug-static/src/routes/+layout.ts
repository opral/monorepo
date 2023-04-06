import { initI18nRuntime, inlangSymbol } from "../inlang.js"
import type { LayoutLoad } from "./$types.js"

export const load = (async ({ data, fetch }) => {
	const runtime = await initI18nRuntime(fetch, data.language)

	const i = runtime.getInlangFunction()
	console.info("+layout.ts", i("welcome"))

	return { ...(data || {}), [inlangSymbol]: runtime }
}) satisfies LayoutLoad
