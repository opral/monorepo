import { isLocale } from "./is-locale.js";

/**
 * Extracts the locale from a given path.
 *
 * @example
 *   const path = '/en/home';
 *   const locale = localeInPath(path);
 *   console.log(locale); // 'en'
 *
 * @param {string} path - The path from which to extract the locale.
 * @returns {Locale|undefined} The extracted locale, or undefined if no locale is found.
 */
export function localeInPath(path) {
	const [, maybeLocale] = path.split("/");
	if (isLocale(maybeLocale)) {
		return maybeLocale;
	}
	return undefined;
}
