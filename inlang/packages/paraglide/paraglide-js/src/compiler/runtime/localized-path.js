/**
 * Localizes the given path.
 *
 * This function is useful if you use localized (i18n) routing
 * in your application.
 *
 * Defaults to `getLocale()` if no locale is provided.
 * 
 * @tip
 *   Use `delocalizedPath()` for the inverse operation.
 *
 * @example
 *  // getLocale() = 'en'
 *  localizedPath('/home'));
 *  // '/de/home'
 *
 *  // enforcing a specific locale
 *  localizedPath('/home', { locale: 'fr' });
 *  // '/fr/home'
 *
 * @example
 *   <a href={localizedPath('/home')}>Home</a>
 *
 * @param {string} path
 * @param {Object} [options] - Optional parameters.
 * @param {Locale} [options.locale] - The locale to use for the path.
 * @returns {string}
 */
export function localizedPath(path, options) {
	const locale = options?.locale ?? getLocale();
	const hasLocale = getLocaleFromPath(path);
	const pathWithoutLocale = hasLocale
		? "/" + path.split("/").slice(2).join("/")
		: path;

	if (locale === baseLocale) {
		return pathWithoutLocale;
	} else {
		return `/${locale}${pathWithoutLocale}`;
	}
}
