import { getRuntimeFromLocals, initRootServerLayoutLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/server"
import type { LayoutServerLoad } from "./$types.js"

export const prerender = true

export const load = initRootServerLayoutLoadWrapper<LayoutServerLoad>().wrap(async ({ locals }) => {
	const runtime = getRuntimeFromLocals(locals)

	console.info("+layout.server.ts", runtime.i("welcome"))

	return {
		"+layout.server.ts": Math.random(),
	}
})
