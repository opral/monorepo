import { getRuntimeFromData } from '@inlang/sdk-js/adapter-sveltekit/shared'
import type { PageLoad } from "./$types.js"

export const load = (async ({ parent }) => {
	const data = await parent()

	const i = getRuntimeFromData(data).i
	console.info("[lang]/about/+page.ts", i("welcome"))
}) satisfies PageLoad
