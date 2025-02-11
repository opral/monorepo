import { assertIsLocale } from "./assert-is-locale.js";
import { urlPatterns } from "./variables.js";

/**
 * Extracts the locale from a given pathname.
 *
 * @example
 *   const pathname = '/en/home';
 *   const locale = extractLocaleFromUrl(pathname);
 *   console.log(locale); // 'en'
 *
 * @param {string} url - The pathname from which to extract the locale.
 * @returns {Locale|undefined} The extracted locale, or undefined if no locale is found.
 */
export function extractLocaleFromUrl(url) {
	let currentOrigin = window.location.origin;
	const urlObj = new URL(url, currentOrigin);

	for (const element of urlPatterns) {
		const match = pathToRegexp.match(element.pattern)(urlObj.href);
		if (match) {
			return assertIsLocale(element.locale);
		}
	}

	return undefined;
}
