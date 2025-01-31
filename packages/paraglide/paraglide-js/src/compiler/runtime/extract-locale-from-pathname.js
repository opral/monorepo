import { isLocale } from "./is-locale.js";
import { baseLocale, pathnamePrefixDefaultLocale } from "./variables.js";

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
	const [, maybeLocale] = pathname.split("/");

	if (pathnamePrefixDefaultLocale && maybeLocale === baseLocale) {
		return baseLocale;
	} else if (
		pathnamePrefixDefaultLocale === false &&
		maybeLocale === baseLocale
	) {
		return undefined;
	} else if (isLocale(maybeLocale)) {
		return maybeLocale;
	} else {
		// it's not possible to match deterministically
		// if the path is the baseLocale at this point
		// or not. users should use the strategy api
		// to set the base locale as fallback
		return undefined;
	}
}
