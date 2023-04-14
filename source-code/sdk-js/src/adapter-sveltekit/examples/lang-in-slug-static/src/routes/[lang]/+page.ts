import { getRuntimeFromData } from '@inlang/sdk-js/adapter-sveltekit/shared'
import type { PageLoad } from "./$types.js"

export const load = (async ({ parent }) => {
	const data = await parent()

	const i = getRuntimeFromData(data).getInlangFunction()
	console.info("[lang]/+page.ts", i("welcome"))
}) satisfies PageLoad
