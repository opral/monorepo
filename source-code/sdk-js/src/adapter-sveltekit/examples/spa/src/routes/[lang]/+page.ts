import { inlangSymbol } from "../../inlang.js"
import type { PageLoad } from "./$types.js"

export const load = (async ({ parent }) => {
	const data = await parent()

	const i = data[inlangSymbol].getLookupFunction()
	console.info("[lang]/+page.ts", i("welcome"))
}) satisfies PageLoad
