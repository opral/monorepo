import { getRuntimeFromLocals } from "@inlang/sdk-js/adapter-sveltekit/server"
import type { LayoutServerLoad } from "./$types.js"

export const load = (async ({ locals }) => {
	const runtime = getRuntimeFromLocals(locals)

	console.info("+layout.server.ts", runtime.i("welcome"))

	return {
		"+layout.server.ts": Math.random(),
		referenceLanguage: runtime.referenceLanguage, // TODO: only pass this if `referenceLanguage` gets used somewhere or detection strategy is on client
		languages: runtime.languages, // TODO: only pass this if `languages` get used somewhere
		language: runtime.language, // TODO: only pass this if `language` gets detected on server
	}
}) satisfies LayoutServerLoad
