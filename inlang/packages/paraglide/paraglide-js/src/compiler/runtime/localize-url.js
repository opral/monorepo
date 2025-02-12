import { getLocale } from "./get-locale.js";
import { urlPatterns } from "./variables.js";

/**
 *
 * @param {string} url
 * @param {Object} [options] - Optional parameters.
 * @param {Locale} [options.locale] - The locale to use for the path.
 * @returns {string}
 */
export function localizeUrl(url, options) {
	// const currentOrigin =
	// 	typeof window === "undefined" ? undefined : window.location.origin;
	// const urlObj = new URL(url, currentOrigin);
	const locale = options?.locale ?? getLocale();

	for (const { pattern, locale: patternLocale } of urlPatterns) {
		const match = pathToRegexp.match(pattern)(url);
		if (match) {
			if (locale === patternLocale) {
				return url;
			} else {
				for (const { pattern, locale: toBeMatchedLocale } of urlPatterns) {
					if (locale === toBeMatchedLocale) {
						return decodeURIComponent(
							pathToRegexp.compile(pattern)({
								...match.params,
							})
						);
					}
				}
			}
		}
	}

	throw new Error(
		"No match found for localized url. Check urlPatterns option."
	);
}
