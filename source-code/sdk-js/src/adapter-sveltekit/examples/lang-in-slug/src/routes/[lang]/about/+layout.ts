import { inlangSymbol } from "../../../inlang"
import type { LayoutLoad } from "./$types.js.js"

export const load = (async ({ parent }) => {
	const data = await parent()

	const i = data[inlangSymbol].getLookupFunction()
	console.info("about/+layout.ts", i("welcome"))
}) satisfies LayoutLoad
