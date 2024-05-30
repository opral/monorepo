import { headers } from "next/headers"
import { sourceLanguageTag, isAvailableLanguageTag } from "$paraglide/runtime.js"
import { PARAGLIDE_LANGUAGE_HEADER_NAME } from "./constants"

/**
 * Returns the current language tag.
 * (server-side way)
 *
 * THIS WILL BECOME OBSOLETE ONCE WE FIGURE OUT HOW TO SET THE LANGUAGE BEFORE ANY NEXT CODE RUNS
 * Once that's the case we will be able to just use `languageTag()` instead
 */
export function getLanguage<T extends string>(): T {
	try {
		const langHeader = headers().get(PARAGLIDE_LANGUAGE_HEADER_NAME)
		const lang = isAvailableLanguageTag(langHeader) ? langHeader : sourceLanguageTag
		return lang as T
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
