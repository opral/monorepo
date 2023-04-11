import { getInlangInformationFromLocals } from "../inlang.server.js"
import type { LayoutServerLoad } from "./$types.js"

export const load = (async ({ locals, url }) => {
	const inlang = getInlangInformationFromLocals(locals)

	console.info("+layout.server.ts", inlang.i("welcome"))

	url.pathname // just to trigger invalidation on url change

	return {
		"+layout.server.ts": Math.random(),
		language: inlang.language, // TODO: only pass this if `language` gets detected on server
		referenceLanguage: inlang.referenceLanguage, // TODO: only pass this if `referenceLanguage` gets used somewhere or detection strategy is on client
		languages: inlang.languages, // TODO: only pass this if `languages` get used somewhere
	}
}) satisfies LayoutServerLoad
