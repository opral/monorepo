import { extractLocaleFromPathname } from "./extract-locale-from-pathname.js";
import {
	pathnameBase,
	pathnames,
	TREE_SHAKE_IS_DEFAULT_PATHNAMES,
} from "./variables.js";

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
	let path = url.pathname;

	// no dynamic matching is needed if the default pathnames are used
	if (TREE_SHAKE_IS_DEFAULT_PATHNAMES) {
		const locale = extractLocaleFromPathname(path);
		if (locale) path = path.replace(`/${locale}`, "") || "/";
		return path + url.search;
	}

	if (pathnameBase && path.startsWith(pathnameBase)) {
		path = path.replace(pathnameBase, "");
	}

	for (const [unLocalizedPattern, locales] of Object.entries(pathnames)) {
		for (const [, localizedPattern] of Object.entries(locales)) {
			const match = pathToRegexp.match(localizedPattern)(path);
			if (match) {
				return (
					(pathnameBase || "") +
					pathToRegexp.compile(unLocalizedPattern)(match.params) +
					url.search
				);
			}
		}
	}

	throw new Error("No match found for localized path. Check pathnames option.");
}
