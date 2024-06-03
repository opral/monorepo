import { headers } from "next/headers"
import { PARAGLIDE_LANGUAGE_HEADER_NAME } from "../constants"
import { isAvailableLanguageTag, sourceLanguageTag } from "$paraglide/runtime.js"

/**
 * Returns the language that was used for this request
 */
export function getLanugageFromRequest() {
	try {
		const langHeader = headers().get(PARAGLIDE_LANGUAGE_HEADER_NAME)
		return isAvailableLanguageTag(langHeader) ? langHeader : sourceLanguageTag
	} catch (e) {
		if (
			e instanceof Error &&
			e.message.includes("Invariant: headers() expects to have requestAsyncStorage, none available")
		) {
			const msg = [
				"Tried to access the languageTag when no request was available.",
				"A common cause for this is using messages in a top-level variable.",
				"If you need to use a message in a top-level variable, make the variable a getter function instead.",
				"",
				"See https://github.com/opral/inlang-paraglide-js/issues/132 for more information.",
			].join("\n")
			throw Error(msg, {
				cause: e,
			})
		}

		throw e
	}
}
