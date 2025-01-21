/**
 * De-localizes the given localized path.
 *
 * This function removes the locale from the given path, returning the
 * base path without the locale prefix.
 *
 * Useful when you need to work with non-localized paths from a localized routing system.
 *
 * @tip
 *   Use `localizedPath()` for the inverse operation.
 *
 * @example
 *  // Assuming baseLocale = 'en'
 *  deLocalizedPath('/fr/home');
 *  // '/home'
 *
 *  deLocalizedPath('/en/home');
 *  // '/home'
 *
 *  deLocalizedPath('/home');
 *  // '/home' (no change)
 *
 * @param {string} path - The localized path to de-localize.
 * @returns {string} The de-localized path without the locale prefix.
 */
export function deLocalizedPath(path) {
	const hasLocale = getLocaleFromPath(path);
	if (!hasLocale) {
		return path; // Path is already de-localized
	}
	return "/" + path.split("/").slice(2).join("/");
}
