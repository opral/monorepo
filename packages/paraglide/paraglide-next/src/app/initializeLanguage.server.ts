import { setLanguageTag } from "$paraglide/runtime.js"
import { getLanguage } from "./getLanguage.server"

/**
 * Set's the language on the server based on the current request.
 *
 * This should be called at the top of server action files.
 *
 * @example
 * ```ts
 * "use server";
 * import { initializeLanguage } from "@inlang/paraglide-next"
 * import { languageTag } from "@/paraglide/runtime"
 *
 * initializeLanguage() //call it at the top of the file
 *
 * export function someAction() {
 *   languageTag() // "de"
 * }
 * ```
 */
export function initializeLanguage() {
	//for some reason we can't pass the function as a reference directly
	setLanguageTag(() => getLanguage())
}
