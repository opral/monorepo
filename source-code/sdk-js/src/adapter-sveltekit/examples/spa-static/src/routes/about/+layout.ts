import { browser } from "$app/environment"
import { inlangSymbol } from "../../inlang.js"
import type { LayoutLoad } from "./$types.js"

export const load = (async ({ parent }) => {
	if (browser) {
		const data = await parent()

		const i = data[inlangSymbol]!.getInlangFunction()
		console.info("about/+layout.ts", i("welcome"))
	}
}) satisfies LayoutLoad
