import { inlangSymbol } from "../../inlang.js"
import type { LayoutLoad } from "./$types.js"

export const load = (async ({ parent }) => {
	const data = await parent()

	const i = data[inlangSymbol].getLookupFunction()

	console.info("[lang]/+layout.ts", i("welcome"))
}) satisfies LayoutLoad
