import { assertIsLocale } from "./assert-is-locale.js";
import { isLocale } from "./is-locale.js";
import {
	baseLocale,
	pathnames,
	TREE_SHAKE_IS_DEFAULT_PATHNAMES,
} from "./variables.js";

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
	// optimization for default pathnames that doesn't require dynamic matching
	if (TREE_SHAKE_IS_DEFAULT_PATHNAMES) {
		const [, maybeLocale] = pathname.split("/");
		if (isLocale(maybeLocale)) {
			return maybeLocale;
		} else {
			return baseLocale;
		}
	}
	// custom pathnames are defined, needs dynamic matching
	else {
		for (const patterns of Object.values(pathnames)) {
			for (const [locale, localizedPattern] of Object.entries(patterns)) {
				if (pathToRegexp.match(localizedPattern)(pathname)) {
					return assertIsLocale(locale);
				}
			}
		}
	}
}
