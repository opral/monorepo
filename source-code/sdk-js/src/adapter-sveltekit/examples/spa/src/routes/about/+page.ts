import { browser } from "$app/environment"
import { getRuntimeFromData } from "@inlang/sdk-js/adapter-sveltekit/shared"
import type { PageLoad } from "./$types.js"

export const load = (async ({ parent }) => {
	if (browser) {
		const data = await parent()

		const i = getRuntimeFromData(data).getInlangFunction()
		console.info("about/+page.ts", i("welcome"))
	}
}) satisfies PageLoad
