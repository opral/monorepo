import { setLanguageTag } from "$paraglide/runtime.js"
import { getLanguage } from "./getLanguage.server"

/**
 * Set's the language on the server based on the current request.
 *
 * This should be called at the top of server action files.
 *
 * @example
 * ```ts
 * import { initializeLanguage } from "@inlang/paraglide-next"
 * initializeLanguage()
 *
 * export default async function () {}
 * ```
 */
export function initializeLanguage() {
	setLanguageTag(() => getLanguage())
}
