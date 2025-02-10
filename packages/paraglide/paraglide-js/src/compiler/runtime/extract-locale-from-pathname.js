import { assertIsLocale } from "./assert-is-locale.js";
import { isLocale } from "./is-locale.js";
import {
	baseLocale,
	pathnameBase,
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
	let normalizedPathname = pathname;

	// remove pathnameBase from the beginning of the pathname
	if (pathnameBase) {
		normalizedPathname = pathname.replace(pathnameBase, "");
	}

	// in case removing the pathnameBase results in an empty string, set it to "/"
	if (normalizedPathname === "") {
		normalizedPathname = "/";
	}

	// optimization for default pathnames that doesn't require dynamic matching
	if (TREE_SHAKE_IS_DEFAULT_PATHNAMES) {
		const [, maybeLocale] = normalizedPathname.split("/");
		if (isLocale(maybeLocale) && maybeLocale !== baseLocale) {
			return maybeLocale;
		} else {
			return baseLocale;
		}
	}
	// custom pathnames are defined, needs dynamic matching
	else {
		for (const patterns of Object.values(pathnames)) {
			for (const [locale, localizedPattern] of Object.entries(patterns)) {
				if (pathToRegexp.match(localizedPattern)(normalizedPathname)) {
					return assertIsLocale(locale);
				}
			}
		}
	}
}
