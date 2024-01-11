/**
 * Maps canonical paths to translations for each language.
 *
 * @example
 * ```json
 * {
 *   "/": {
 *    "en": "/",
 *    "de": "/de"
 *   },
 *   "/about": {
 *     "en": "/about",
 *     "de": "/ueber-uns"
 *   },
 *   "/admin/users/[id]": {
 *     "en": "/admin/users/[id]",
 *     "de": "/admin/benutzer/[id]"
 *   }
 * }
 * ```
 */
export type PathTranslations = {
	[canonicalPath: string]: {
		[languageTag: string]: string
	}
}
