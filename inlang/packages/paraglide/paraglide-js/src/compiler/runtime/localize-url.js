import { urlPatterns } from "./variables.js";

/**
 * Localizes a URL to a specific locale using the new namedGroups API.
 * @param {string} url - The URL to localize.
 * @param {Object} options - Options containing the target locale.
 * @param {string} options.locale - The target locale.
 * @returns {string} - The localized URL.
 */
export function localizeUrl(url, { locale }) {
	const urlObj = new URL(url);

	for (const element of urlPatterns) {
		const pattern = new URLPattern(element.pattern);
		const match = pattern.exec(urlObj.href);

		if (match) {
			/** @type {Record<string, string | null >} */
			const overrides = {};

			for (const [groupName, locales] of Object.entries(
				element.localizedNamedGroups ?? {}
			)) {
				if (locales[locale] !== undefined) {
					overrides[groupName] = locales[locale];
				}
			}

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
 * De-localizes a URL back to the base locale using the new namedGroups API.
 * @param {string} url - The localized URL.
 * @returns {string} - The de-localized URL.
 */
export function deLocalizeUrl(url) {
	const urlObj = new URL(url);

	for (const element of urlPatterns) {
		const pattern = new URLPattern(element.pattern);
		const match = pattern.exec(urlObj.href);

		if (match) {
			/** @type {Record<string, string | null>} */
			const overrides = {};

			for (const [groupName, value] of Object.entries(
				element.deLocalizedNamedGroups ?? {}
			)) {
				overrides[groupName] = value;
			}

			const groups = {
				...match.protocol.groups,
				...match.hostname.groups,
				...match.pathname.groups,
				...overrides,
			};

			return fillPattern(element.pattern, groups);
		}
	}

	return url; // Return original if no match
}

/**
 * Fills a URL pattern with values for named groups, supporting all URLPattern-style modifiers:
 *
 * Matches:
 * - :name        -> Simple
 * - :name?       -> Optional
 * - :name+       -> One or more
 * - :name*       -> Zero or more
 * - :name(...)   -> Regex group
 *
 * If the value is `null`, the segment is removed.
 *
 * @param {string} pattern - The URL pattern containing named groups.
 * @param {Record<string, string | null | undefined>} values - Object of values for named groups.
 * @returns {string} - The constructed URL with named groups filled.
 */
function fillPattern(pattern, values) {
	const filled = pattern.replace(
		/(\/?):([a-zA-Z0-9_]+)(\([^)]*\))?([?+*]?)/g,
		(_, slash, name, __, modifier) => {
			const value = values[name];

			if (value === null) {
				// If value is null, remove the entire segment including the preceding slash
				return "";
			}

			if (modifier === "?") {
				// Optional segment
				return value !== undefined ? `${slash}${value}` : "";
			}

			if (modifier === "+" || modifier === "*") {
				// Repeatable segments
				if (value === undefined && modifier === "+") {
					throw new Error(`Missing value for "${name}" (one or more required)`);
				}
				return value ? `${slash}${value}` : "";
			}

			// Simple named group (no modifier)
			if (value === undefined) {
				throw new Error(`Missing value for "${name}"`);
			}

			return `${slash}${value}`;
		}
	);

	// Final cleanup: collapse consecutive slashes (excluding protocol slashes)
	return filled.replace(/([^:]\/)\/+/g, "$1");
}
