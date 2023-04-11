import { getInlangInformationFromLocals } from "../inlang.server.js"
import type { LayoutServerLoad } from "./$types.js"

export const load = (async ({ locals, url }) => {
	const inlang = getInlangInformationFromLocals(locals)

	console.info("+layout.server.ts", inlang.i("welcome"))

	url.pathname // just to trigger invalidation on url change

	return {
		"+layout.server.ts": Math.random(),
		language: inlang.language,
		referenceLanguage: inlang.referenceLanguage,
		languages: inlang.languages,
	}
}) satisfies LayoutServerLoad
