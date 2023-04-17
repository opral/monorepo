import { getRuntimeFromLocals } from "@inlang/sdk-js/adapter-sveltekit/server"
import type { PageServerLoad } from "./$types.js"

export const load = (async ({ locals }) => {
	const runtime = getRuntimeFromLocals(locals)

	console.info("[lang]/+page.server.ts", runtime.i("welcome"))
}) satisfies PageServerLoad
