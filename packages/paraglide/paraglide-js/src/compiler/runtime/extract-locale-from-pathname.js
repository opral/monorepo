import { pathnames } from "./variables.js";

/**
 * Extracts the locale from a given pathname.
 *
 * @example
 *   const pathname = '/en/home';
 *   const locale = extractLocaleFromPathname(pathname);
 *   console.log(locale); // 'en'
 *
 * @param {string} pathname - The pathname from which to extract the locale.
 * @returns {Locale|undefined} The extracted locale, or undefined if no locale is found.
 */
export function extractLocaleFromPathname(pathname) {
	for (const patterns of Object.values(pathnames)) {
		for (const [locale, localizedPattern] of Object.entries(patterns)) {
			if (pathToRegexp.match(localizedPattern)(pathname)) {
				return locale;
			}
		}
	}
}
