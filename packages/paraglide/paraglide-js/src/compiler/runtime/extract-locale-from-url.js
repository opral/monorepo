import { assertIsLocale } from "./assert-is-locale.js";
import { isLocale } from "./is-locale.js";
import { aggregateGroups } from "./localize-url.js";
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
	for (const element of urlPatterns) {
		const pattern = new URLPattern(element.pattern);
		const match = pattern.exec(url);
		if (match) {
			const groups = aggregateGroups(match);

			for (const [locale, overrideParams] of Object.entries(
				element.localizedNamedGroups
			)) {
				let allMatch = true;

				for (const [key, val] of Object.entries(overrideParams)) {
					const matchedValue = groups[key.replace("?", "")];

					// Handle nullable parameters
					if (val === null) {
						if (matchedValue != null) {
							allMatch = false;
							break;
						}
					}
					// Handle wildcard arrays
					else if (Array.isArray(val)) {
						const matchedArray = matchedValue?.split("/") ?? [];
						if (JSON.stringify(matchedArray) !== JSON.stringify(val)) {
							allMatch = false;
							break;
						}
					}
					// optional parameters
					else if (key.endsWith("?") && matchedValue === undefined) {
						continue;
					}
					// Handle regular parameters
					else if (matchedValue !== val) {
						allMatch = false;
						break;
					}
				}

				if (allMatch) {
					return assertIsLocale(locale);
				}
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
