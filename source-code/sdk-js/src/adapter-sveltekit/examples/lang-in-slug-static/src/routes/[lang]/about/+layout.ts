import { getInlangPayload } from '@inlang/sdk-js/adapter-sveltekit/shared'
import type { LayoutLoad } from "./$types.js"

export const load = (async ({ parent }) => {
	const data = await parent()

	const i = getInlangPayload(data).getInlangFunction()
	console.info("[lang]/about/+layout.ts", i("welcome"))
}) satisfies LayoutLoad
