import { baseLocale } from "./base-locale.js";
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
 * @param {string} path
 * @param {Object} [options] - Optional parameters.
 * @param {Locale} [options.locale] - The locale to use for the path.
 * @returns {string}
 */
export function localizePath(path, options) {
	const locale = options?.locale ?? getLocale();
	const hasLocale = extractLocaleFromPathname(path);
	const pathWithoutLocale = hasLocale
		? "/" + path.split("/").slice(2).join("/")
		: path;

	if (locale === baseLocale) {
		return pathWithoutLocale;
	} else if (path === "/" || pathWithoutLocale === "/") {
		return `/${locale}`;
	} else {
		return `/${locale}${pathWithoutLocale}`;
	}
}
