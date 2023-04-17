import { initRootServerLayoutLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/server"
import type { LayoutServerLoad } from "./$types.js"

export const load = initRootServerLayoutLoadWrapper<LayoutServerLoad>().wrap(() => {
	return { "+layout.server.ts": Math.random() }
}) satisfies LayoutServerLoad
