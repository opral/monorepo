import { urlPatterns } from "./variables.js";

/**
 *
 * @param {string} url
 * @param {Object} [options] - Optional parameters.
 * @param {Locale} [options.locale] - The locale to use for the path.
 * @returns {string}
 */
export function localizeUrlV3(url, options) {
	const urlObj = new URL(url, "https://fallback");

	for (const { pattern, paramOverrides } of urlPatterns) {
		const matcher = pathToRegexp.match(pattern);
		const matched = matcher(urlObj.href);
		if (matched) {
			// e.g. matched.params = { domain: "de.example.com", path: "about" }
			const overrides = paramOverrides[options?.locale] || {};
			const finalParams = { ...matched.params, ...overrides };
			// => { domain: "example.com", path: "about" } if locale='en'

			const toPath = pathToRegexp.compile(pattern);
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
