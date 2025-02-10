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
	let path = pathnameBase
		? pathname.replace(pathnameBase, "") || "/"
		: pathname;

	// optimization to avoid loading the path-to-regexp library
	// which saves around 2kb gzipped
	if (TREE_SHAKE_IS_DEFAULT_PATHNAMES) {
		const [, maybeLocale] = path.split("/");
		return isLocale(maybeLocale) && maybeLocale !== baseLocale
			? maybeLocale
			: baseLocale;
	}

	for (const patterns of Object.values(pathnames)) {
		for (const [locale, localizedPattern] of Object.entries(patterns)) {
			if (pathToRegexp.match(localizedPattern)(path)) {
				return assertIsLocale(locale);
			}
		}
	}

	return undefined;
}
