import { getInlangInformationFromLocals } from "../../../inlang.server.js"
import type { LayoutServerLoad } from "./$types.js"

export const load = (async ({ locals }) => {
	const inlang = getInlangInformationFromLocals(locals)

	console.info("[lang]/about/+layout.server.ts", inlang.i("welcome"))
}) satisfies LayoutServerLoad
