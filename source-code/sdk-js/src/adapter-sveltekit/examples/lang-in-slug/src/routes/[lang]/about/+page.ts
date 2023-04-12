import { getInlangPayload } from '@inlang/sdk-js/adapter-sveltekit/shared'
import type { PageLoad } from "./$types.js"

export const load = (async ({ parent }) => {
	const data = await parent()

	const i = getInlangPayload(data).getInlangFunction()
	console.info("[lang]/about/+page.ts", i("welcome"))
}) satisfies PageLoad
