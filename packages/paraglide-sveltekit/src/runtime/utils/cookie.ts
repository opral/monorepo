import { LANG_COOKIE_NAME } from "../../constants.js"
import type { NormalizedBase } from "./normaliseBase.js"

/**
 * Returns a language cookie string that can be assigned to `document.cookie`.
 *
 * Use this to update the language cookie in the browser.
 *
 * The cookie lasts for 1 year.
 */
export const createLangCookie = (lang: string, path: NormalizedBase) =>
	`${LANG_COOKIE_NAME}=${lang};Path=${path};SameSite=lax;Max-Age=31557600`
