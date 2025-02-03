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
	const base = "https://example.com";

	const url = new URL(pathname, base);

	for (const [unLocalizedPattern, locales] of Object.entries(pathnames)) {
		for (const [, localizedPattern] of Object.entries(locales)) {
			const urlPattern = new URLPattern({
				pathname: localizedPattern,
				baseURL: base,
			});

			const match = urlPattern.exec(url);

			if (match) {
				let deLocalizedPath = unLocalizedPattern;

				// Replace dynamic segments
				for (const [key, value] of Object.entries(
					match.pathname.groups ?? {}
				)) {
					if (value === undefined) {
						continue;
					}
					// check if group name is a number in which case it is an unnamed group
					// https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API#unnamed_and_named_groups
					if (/^\d+$/.test(key)) {
						deLocalizedPath = deLocalizedPath.replace(/\(.*?\)/, value);
					} else {
						deLocalizedPath = deLocalizedPath.replace(`:${key}`, value);
					}
				}

				deLocalizedPath = deLocalizedPath.replace("*", "");

				return deLocalizedPath + url.search;
			}
		}
	}

	throw new Error(
		"No match found for localized path. Refer to the documentation on how to define pathnames."
	);

	// const hasLocale = extractLocaleFromPathname(pathname);
	// if (!hasLocale) {
	// 	return pathname; // Path is already de-localized
	// }
	// return "/" + pathname.split("/").slice(2).join("/");
}
