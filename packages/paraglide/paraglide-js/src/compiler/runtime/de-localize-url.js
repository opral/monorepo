import { urlPatterns } from "./variables.js";

/**
 * De-localizes a given localized url.
 *
 * @example
 *   deLocalizeUrl('http://host.com/de/home');
 *   // -> 'http://host.com/home'
 *
 *
 * @param {string} url
 * @returns {string}
 */
export function deLocalizeUrl(url) {
	const currentOrigin =
		typeof window === "undefined" ? undefined : window.location.origin;
	const urlObj = new URL(url, currentOrigin);

	for (const { pattern, deLocalizedPattern } of urlPatterns) {
		const match = pathToRegexp.match(pattern)(urlObj.href);
		if (match) {
			const compiled = new URL(
				pathToRegexp.compile(deLocalizedPattern)({
					...match.params,
				})
			);
			return compiled.href;
		}
	}

	throw new Error(
		"No match found for de-localized URL. Check urlPatterns option."
	);
}
