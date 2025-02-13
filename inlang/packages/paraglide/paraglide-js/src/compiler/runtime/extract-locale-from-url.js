import { assertIsLocale } from "./assert-is-locale.js";
import { urlPatterns } from "./variables.js";

/**
 * Extracts the locale from a given url.
 *
 * @param {string} url - The full URL from which to extract the locale.
 * @returns {Locale|undefined} The extracted locale, or undefined if no locale is found.
 */
export function extractLocaleFromUrl(url) {
	const urlObj = new URL(url);

	for (const element of urlPatterns) {
		const match = pathToRegexp.match(element.pattern)(urlObj.href);

		if (match) {
			for (const [locale, overrideParams] of Object.entries(
				element.localizedParams
			)) {
				let allMatch = true;

				for (const [key, val] of Object.entries(overrideParams)) {
					// overwritten parameter like { locale: null }
					if (val === null) {
						if (match.params[key] != null) {
							allMatch = false;
							break;
						}
					}
					// wildcard match like `/*domain` where the parameter is an array
					else if (Array.isArray(val) && Array.isArray(match.params[key])) {
						for (let i = 0; i < match.params[key].length; i++) {
							if (match.params[key][i] !== val[i]) {
								allMatch = false;
								break;
							}
						}
					}
					// regular parameter match like `/:domain`
					else if (match.params[key] !== val) {
						allMatch = false;
						break;
					}
				}

				if (allMatch) {
					// e.g. if overrideParams = { locale: 'fr' }, we found locale 'fr'
					return assertIsLocale(locale);
				}
			}
		}
	}

	return undefined;
}
