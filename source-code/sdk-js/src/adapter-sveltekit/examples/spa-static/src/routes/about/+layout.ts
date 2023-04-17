import { getRuntimeFromData } from "@inlang/sdk-js/adapter-sveltekit/shared"
import type { LayoutLoad } from "./$types.js"

export const load = (async ({ parent }) => {
		const data = await parent()

		const i = getRuntimeFromData(data).i
	console.info("about/+layout.ts", i("welcome"))
}) satisfies LayoutLoad
