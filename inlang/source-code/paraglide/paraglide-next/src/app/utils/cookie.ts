import { LANG_COOKIE_NAME } from "../constants"

/**
 * Returns the value of the language cookie
 *
 * Lasts for 1 year
 *
 * @param {string} path - The path to set the cookie on, usually the base path
 */
export const languageCookie = (value: string, path: string) =>
	`${LANG_COOKIE_NAME}=${value};Max-Age=31557600;Path=${path};SameSite=lax`
