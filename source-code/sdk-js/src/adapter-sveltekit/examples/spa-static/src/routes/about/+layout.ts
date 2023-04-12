import { browser } from "$app/environment"
import { getInlangPayload } from "@inlang/sdk-js/adapter-sveltekit/shared"
import type { LayoutLoad } from "./$types.js"

export const load = (async ({ parent }) => {
	if (browser) {
		const data = await parent()

		const i = getInlangPayload(data).getInlangFunction()
		console.info("about/+layout.ts", i("welcome"))
	}
}) satisfies LayoutLoad
