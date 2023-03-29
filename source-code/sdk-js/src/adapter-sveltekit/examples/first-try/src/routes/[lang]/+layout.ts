import { initI18nRuntime, inlangSymbol } from "../../inlang.js"
import type { LayoutLoad } from "./$types.js"

export const load = (async ({ data: { language }, fetch }) => {
	const runtime = await initI18nRuntime(fetch, language)

	const i = runtime.getLookupFunction()
	console.info("+layout.ts", i("welcome"))

	return { [inlangSymbol]: runtime }
}) satisfies LayoutLoad
