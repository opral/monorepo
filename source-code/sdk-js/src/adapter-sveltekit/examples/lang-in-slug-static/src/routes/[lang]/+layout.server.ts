import { getInlangInformationFromLocals } from "@inlang/sdk-js/adapter-sveltekit/server"
import type { LayoutServerLoad } from "./$types.js"

export const load = (async ({ locals }) => {
	const inlang = getInlangInformationFromLocals(locals)

	console.info("[lang]/+layout.server.ts", inlang.i("welcome"))
}) satisfies LayoutServerLoad
