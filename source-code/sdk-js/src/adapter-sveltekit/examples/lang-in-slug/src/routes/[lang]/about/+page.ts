import { inlangSymbol } from "../../../inlang.js"
import type { PageLoad } from "./$types.js"

export const load = (async ({ parent }) => {
	const data = await parent()

	const i = data[inlangSymbol].getInlangFunction()
	console.info("[lang]/about/+page.ts", i("welcome"))
}) satisfies PageLoad
