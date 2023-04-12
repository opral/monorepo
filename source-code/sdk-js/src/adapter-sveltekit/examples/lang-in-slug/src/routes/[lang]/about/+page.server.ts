import { getInlangInformationFromLocals } from "@inlang/sdk-js/adapter-sveltekit/server"
import type { PageServerLoad } from "./$types.js"

export const load = (async ({ locals }) => {
	const inlang = getInlangInformationFromLocals(locals)

	console.info("[lang]/about/+page.server.ts", inlang.i("welcome"))
}) satisfies PageServerLoad
