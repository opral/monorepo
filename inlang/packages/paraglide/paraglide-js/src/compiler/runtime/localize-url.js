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
	const currentOrigin =
		typeof window === "undefined" ? undefined : window.location.origin;
	const urlObj = new URL(url, currentOrigin);
	const locale = options?.locale ?? getLocale();

	for (const { pattern, locale: patternLocale } of urlPatterns) {
		const match = pathToRegexp.match(pattern)(urlObj.href);
		if (match) {
			if (locale === patternLocale) {
				return urlObj.href;
			} else {
				for (const { pattern, locale: toBeMatchedLocale } of urlPatterns) {
					if (locale === toBeMatchedLocale) {
						return new URL(
							pathToRegexp.compile(pattern)({
								...match.params,
								locale,
							})
						).href;
					}
				}
			}
		}
	}

	throw new Error(
		"No match found for localized url. Check urlPatterns option."
	);
}
