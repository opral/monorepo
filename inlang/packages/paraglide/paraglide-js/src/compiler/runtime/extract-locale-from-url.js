import { assertIsLocale } from "./assert-is-locale.js";
import { aggregateGroups } from "./localize-url.js";
import { urlPatterns } from "./variables.js";

/**
 * Extracts the locale from a given URL using native URLPattern.
 *
 * @param {string} url - The full URL from which to extract the locale.
 * @returns {Locale|undefined} The extracted locale, or undefined if no locale is found.
 */
export function extractLocaleFromUrl(url) {
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
					const matchedValue = groups[key];

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
