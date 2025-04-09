import { assertIsLocale } from "./assert-is-locale.js";
import { isLocale } from "./is-locale.js";
import {
	baseLocale,
	TREE_SHAKE_DEFAULT_URL_PATTERN_USED,
	urlPatterns,
} from "./variables.js";

/**
 * Extracts the locale from a given URL using native URLPattern.
 *
 * @param {URL|string} url - The full URL from which to extract the locale.
 * @returns {Locale|undefined} The extracted locale, or undefined if no locale is found.
 */
export function extractLocaleFromUrl(url) {
	if (TREE_SHAKE_DEFAULT_URL_PATTERN_USED) {
		return defaultUrlPatternExtractLocale(url);
	}

	const urlObj = typeof url === "string" ? new URL(url) : url;

	// Iterate over URL patterns
	for (const element of urlPatterns) {
		for (const [locale, localizedPattern] of element.localized) {
			const match = new URLPattern(localizedPattern, urlObj.href).exec(
				urlObj.href
			);

			if (!match) {
				continue;
			}

			// Check if the locale is valid
			if (assertIsLocale(locale)) {
				return locale;
			}
		}
	}

	return undefined;
}

/**
 * https://github.com/opral/inlang-paraglide-js/issues/381
 *
 * @param {URL|string} url - The full URL from which to extract the locale.
 * @returns {Locale|undefined} The extracted locale, or undefined if no locale is found.
 */
function defaultUrlPatternExtractLocale(url) {
	const urlObj = new URL(url, "http://dummy.com");
	const pathSegments = urlObj.pathname.split("/").filter(Boolean);
	if (pathSegments.length > 0) {
		const potentialLocale = pathSegments[0];
		if (isLocale(potentialLocale)) {
			return potentialLocale;
		}
	}
	// everything else has to be the base locale
	return baseLocale;
}
