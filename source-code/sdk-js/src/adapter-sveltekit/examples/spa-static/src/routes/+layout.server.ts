import { languages } from "@inlang/sdk-js/adapter-sveltekit/server"
import { referenceLanguage } from "@inlang/sdk-js/adapter-sveltekit/server"
import type { LayoutServerLoad } from "./$types.js"

export const load = (() => {
	return {
		"+layout.server.ts": Math.random(),
		referenceLanguage, // TODO: only pass this if `referenceLanguage` gets used somewhere or detection strategy is on client
		languages, // TODO: only pass this if `languages` gets used somewhere
	}
}) satisfies LayoutServerLoad
