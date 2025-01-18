import type { MessageBundleFunction } from "@inlang/paraglide-js"

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
export type UserPathTranslations<T extends string = string> = {
	[canonicalPath: `/${string}`]: Record<T, `/${string}`> | MessageBundleFunction<T>
}
