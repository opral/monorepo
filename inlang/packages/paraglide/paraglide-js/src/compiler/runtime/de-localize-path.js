import { pathnames } from "./variables.js";

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
 *  deLocalizePath('/fr/home');
 *  // '/home'
 *
 *  deLocalizePath('/en/home');
 *  // '/home'
 *
 *  deLocalizePath('/home');
 *  // '/home' (no change)
 *
 * @param {string} pathname - The localized path to de-localize.
 * @returns {string} The de-localized path without the locale prefix.
 */
export function deLocalizePath(pathname) {
	const url = new URL(pathname, "http://y.com");

	for (const [unLocalizedPattern, locales] of Object.entries(pathnames)) {
		for (const [, localizedPattern] of Object.entries(locales)) {
			const hasMatch = pathToRegexp.match(localizedPattern)(url.pathname);

			if (hasMatch) {
				let deLocalizedPath = pathToRegexp.compile(unLocalizedPattern)(
					hasMatch.params
				);

				return deLocalizedPath + url.search;
			}
		}
	}

	throw new Error(
		"No match found for localized path. Refer to the documentation on how to define pathnames."
	);
}
