import { getRuntimeFromLocals } from "@inlang/sdk-js/adapter-sveltekit/server"
import type { LayoutServerLoad } from "./$types.js"

export const load = (async ({ locals }) => {
	const runtime = getRuntimeFromLocals(locals)

	console.info("[lang]/+layout.server.ts", runtime.i("welcome"))
}) satisfies LayoutServerLoad
