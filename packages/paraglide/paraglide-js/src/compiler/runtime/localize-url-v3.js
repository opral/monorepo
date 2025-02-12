import { baseLocale, urlPatterns } from "./variables.js";

/**
 *
 * @param {string} url
 * @param {Object} [options] - Optional parameters.
 * @param {Locale} [options.locale] - The locale to use for the path.
 * @returns {string}
 */
export function localizeUrlV3(url, options) {
	const urlObj = new URL(url, "https://fallback");

	for (const element of urlPatterns) {
		const matcher = pathToRegexp.match(element.pattern);
		const matched = matcher(urlObj.href);
		if (matched) {
			// e.g. matched.params = { domain: "de.example.com", path: "about" }
			const overrides = element.localizedParams[options?.locale] || {};
			const finalParams = { ...matched.params, ...overrides };
			// => { domain: "example.com", path: "about" } if locale='en'

			const toPath = pathToRegexp.compile(element.pattern);
			const newUrl = toPath(finalParams);
			// => "https://example.com/about"

			// Re-append query/hash
			const finalUrl = new URL(newUrl);
			finalUrl.search = urlObj.search;
			finalUrl.hash = urlObj.hash;
			return finalUrl.href;
		}
	}
	throw new Error(`No match found for ${url}`);
}

/**
 * Switches URL to the baseLocale (e.g. "en"), effectively removing any
 * localized segments like "/de/" or "de.example.com".
 *
 * @param {string} url - The localized URL to de-localize.
 * @returns {string} - The de-localized URL.
 */
export function deLocalizeUrlV3(url) {
	const urlObj = new URL(url, "https://fallback.com");

	// Loop over all patterns to see which one matches
	for (const element of urlPatterns) {
		const matcher = pathToRegexp.match(element.pattern);

		// 2) Attempt to match this pattern to the current URL
		const matchResult = matcher(urlObj.href);
		if (matchResult) {
			// We found a matching pattern
			// e.g. matchResult.params might be { domain: "customer1.fr", locale: "de", path: "about" }

			// 3) Merge matched params with baseLocale overrides
			// If baseLocale is not in paramOverrides, default to an empty object
			const baseOverrides =
				element.deLocalizedParams ?? element.localizedParams[baseLocale] ?? {};
			const finalParams = { ...matchResult.params, ...baseOverrides };

			// 4) Compile the pattern into a new URL
			const toPath = pathToRegexp.compile(element.pattern);
			const newUrl = toPath(finalParams);

			// 5) Preserve query & hash
			const finalUrl = new URL(newUrl);
			finalUrl.search = urlObj.search;
			finalUrl.hash = urlObj.hash;

			return finalUrl.href;
		}
	}

	// If no match found, return the original or throw
	return url;
}
