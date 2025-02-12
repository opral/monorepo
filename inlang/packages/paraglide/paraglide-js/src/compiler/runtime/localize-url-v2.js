import { getLocale } from "./get-locale.js";
import { urlPatterns } from "./variables.js";

/**
 *
 * @param {string} url
 * @param {Object} [options] - Optional parameters.
 * @param {Locale} [options.locale] - The locale to use for the path.
 * @returns {string}
 */
export function localizeUrlV2(url, options) {
	const locale = options?.locale ?? getLocale();

	for (const pattern of urlPatterns) {
		const match = pathToRegexp.match(pattern.base)(url);
		if (match && pattern.locales[locale]) {
			return decodeURIComponent(
				pathToRegexp.compile(pattern.locales[locale])({
					...match.params,
				})
			);
		}
	}

	throw new Error(
		"No match found for localized url. Check urlPatterns option."
	);
}
