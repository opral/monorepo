import { LanguageDetector } from "../middleware/detection/interface"

export interface RoutingStrategy<T extends string> {
	/**
	 * Returns the canonical route that should be rendered.
	 *
	 * @param localisedPath - The Path present in the URL with the base removed
	 * @param locale - The current Lanugage
	 *
	 * @example
	 * ```ts
	 * getCanonicalPath("/de/ueber-uns", "de") // "/about"
	 * getCanonicalPath("/en/about", "en") // "/about"
	 * ```
	 */
	getCanonicalPath(localisedPath: `/${string}`, locale: T): `/${string}`

	/**
	 * Returns a localised URL that can be used to navigate to the localised path corresponding to the canonical path.
	 * This may be an absolute pathname, or a full URL.
	 *
	 * @param canonicalPath - The canonical path
	 * @param targetLocale - The target language the localised href should point to
	 * @param currentLocale - The current language
	 * @param basePath - The base path of the application
	 */
	getLocalisedUrl(
		canonicalPath: `/${string}`,
		targetLocale: T,
		isLanguageSwitch: boolean
	): import("url").UrlObject & { pathname: `/${string}` }

	resolveLocale: LanguageDetector<T>
}
