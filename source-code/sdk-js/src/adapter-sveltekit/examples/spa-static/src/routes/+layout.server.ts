import { languages } from "../inlang.server.js"
import { referenceLanguage } from "../inlang.server.js"
import type { LayoutServerLoad } from "./$types.js"

export const load = (() => {
	return {
		referenceLanguage,
		languages,
	}
}) satisfies LayoutServerLoad
