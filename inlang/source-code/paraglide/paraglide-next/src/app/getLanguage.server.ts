import { cache } from "react"
import { getLanugageFromRequest } from "./middleware/getLanguageFromRequest"

const cached = cache(() => ({
	languageTag: getLanugageFromRequest(),
}))

/**
 * Returns the current language tag.
 * (server-side way)
 *
 * THIS WILL BECOME OBSOLETE ONCE WE FIGURE OUT HOW TO SET THE LANGUAGE BEFORE ANY NEXT CODE RUNS
 * Once that's the case we will be able to just use `languageTag()` instead
 */
export function getLanguage<T extends string>(): T {
	return cached().languageTag as T
}
