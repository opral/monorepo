import { getInlangInformationFromLocals } from "../../inlang.server.js"
import type { PageServerLoad } from "./$types.js"

export const load = (async ({ locals }) => {
	const inlang = getInlangInformationFromLocals(locals)

	console.info("[lang]/+page.server.ts", inlang.i("welcome"))
}) satisfies PageServerLoad
