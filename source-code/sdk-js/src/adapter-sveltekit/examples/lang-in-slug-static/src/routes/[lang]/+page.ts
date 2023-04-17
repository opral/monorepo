import { getRuntimeFromData } from '@inlang/sdk-js/adapter-sveltekit/shared'
import type { PageLoad } from "./$types.js"

export const load = (async ({ parent }) => {
	const data = await parent()

	const runtime = getRuntimeFromData(data)
	console.info("[lang]/+page.ts", runtime.i("welcome"))
}) satisfies PageLoad
