import { baseLocale, urlPatterns } from "./variables.js";

/**
 * Localizes a URL to a specific locale using URLPattern.
 * @param {string} url - The URL to localize.
 * @param {Object} [options] - Optional parameters.
 * @param {Locale} [options.locale] - The locale to use.
 * @returns {string} - The localized URL.
 */
export function localizeUrlV4(url, options) {
	const urlObj = new URL(url);

	for (const element of urlPatterns) {
		const pattern = new URLPattern(element.pattern);

		const match = pattern.exec(urlObj.href);

		if (match) {
			const overrides = element.localizedParams[options?.locale] || {};

			const groups = {
				...match.protocol.groups,
				...match.hostname.groups,
				...match.pathname.groups,
				...overrides,
			};

			return fillPattern(element.pattern, groups);
		}
	}

	throw new Error(`No match found for ${url}`);
}

/**
 * De-localizes a URL back to the base locale using URLPattern.
 * @param {string} url - The localized URL.
 * @returns {string} - The de-localized URL.
 */
export function deLocalizeUrlV4(url) {
	const urlObj = new URL(url);

	for (const element of urlPatterns) {
		const pattern = new URLPattern(urlObj);

		const match = pattern.exec(urlObj.href);
		if (match) {
			const overrides =
				element.deLocalizedParams ?? element.localizedParams[baseLocale] ?? {};
			const combinedGroups = {
				...match.protocol.groups,
				...match.hostname.groups,
				...match.pathname.groups,
				...overrides,
			};

			const newPath = Object.keys(combinedGroups).reduce((acc, key) => {
				return acc.replace(`:${key}`, combinedGroups[key]);
			}, element.pattern);

			const finalUrl = new URL(newPath, urlObj.origin);
			finalUrl.search = urlObj.search;
			finalUrl.hash = urlObj.hash;
			return finalUrl.href;
		}
	}
	return url;
}

/**
 * Fills a URL pattern with values for named groups, supporting URLPattern-style modifiers:
 *
 * - :name        -> Simple (one segment, string)
 * - :name?       -> Optional (omit if not provided or null)
 * - :name+       -> One or more segments (string only)
 * - :name*       -> Zero or more segments (string only)
 * - :name(...)   -> Regex group (user-defined pattern)
 *
 * If the value is `null`, the segment is removed from the pattern entirely.
 *
 * @param {string} pattern - The URL pattern containing named groups.
 * @param {Record<string, string | null | undefined>} values - Object of values for named groups.
 * @returns {string} - The constructed URL with named groups filled.
 */
function fillPattern(pattern, values) {
	const filled = pattern
		// Handle named regex groups (e.g., :id(\d+))
		.replace(
			/(\/?):([a-zA-Z0-9_]+)\([^)]*\)([?+*]?)/g,
			(_, slash, name, modifier) =>
				segmentReplacement(slash, name, values[name], modifier)
		)
		// Handle named groups with modifiers (e.g., :name?, :name+, :name*)
		.replace(/(\/?):([a-zA-Z0-9_]+)([?+*]?)/g, (_, slash, name, modifier) =>
			segmentReplacement(slash, name, values[name], modifier)
		);

	// Final cleanup to remove any double slashes (excluding protocol slashes)
	return filled.replace(/([^:]\/)\/+/g, "$1");
}

/**
 * Replaces a segment based on value and modifier.
 *
 * Modifiers:
 * - ? (optional): Omit if value is null or undefined
 * - + (one or more): Requires a non-empty string
 * - * (zero or more): Accepts an empty string
 *
 * If value is `null`, removes the segment entirely.
 *
 * @param {string} slash - The preceding slash if any.
 * @param {string} name - The group name.
 * @param {string | null | undefined} value - The group value.
 * @param {string} modifier - The group modifier.
 * @returns {string} - The replaced segment or an empty string if removed.
 */
function segmentReplacement(slash, name, value, modifier) {
	if (value === null) {
		// Remove segment if explicitly null
		return "";
	}

	if (modifier === "?") {
		// Optional: Include only if value is defined
		return value !== undefined ? `${slash}${value}` : "";
	}

	if (modifier === "+" || modifier === "*") {
		// Repeatable segments: Must be a string
		if (value === undefined && modifier === "+") {
			throw new Error(`Missing value for "${name}" (one or more required)`);
		}
		return value ? `${slash}${value}` : "";
	}

	// Simple group (no modifier): Requires a value
	if (value === undefined) {
		throw new Error(`Missing value for "${name}"`);
	}

	return `${slash}${value}`;
}
