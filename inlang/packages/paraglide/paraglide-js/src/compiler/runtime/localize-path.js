import { baseLocale, pathnamePrefixDefaultLocale } from "./variables.js";
import { getLocale } from "./get-locale.js";
import { extractLocaleFromPathname } from "./extract-locale-from-pathname.js";

/**
 * Localizes the given path.
 *
 * This function is useful if you use localized (i18n) routing
 * in your application.
 *
 * Defaults to `getLocale()` if no locale is provided.
 *
 * @tip
 *   Use `deLocalizePath()` for the inverse operation.
 *
 * @example
 *  // getLocale() = 'en'
 *  localizePath('/home'));
 *  // '/de/home'
 *
 *  // enforcing a specific locale
 *  localizePath('/home', { locale: 'fr' });
 *  // '/fr/home'
 *
 * @example
 *   <a href={localizePath('/home')}>Home</a>
 *
 * @param {string} pathname
 * @param {Object} [options] - Optional parameters.
 * @param {Locale} [options.locale] - The locale to use for the path.
 * @returns {string}
 */
export function localizePath(pathname, options) {
	const locale = options?.locale ?? getLocale();
	const hasLocale = extractLocaleFromPathname(pathname);
	const pathWithoutLocale = hasLocale
		? "/" + pathname.split("/").slice(2).join("/")
		: pathname;

	if (locale === baseLocale && pathnamePrefixDefaultLocale === false) {
		return pathWithoutLocale;
	} else if (pathname === "/" || pathWithoutLocale === "/") {
		return `/${locale}`;
	} else {
		return `/${locale}${pathWithoutLocale}`;
	}
}
