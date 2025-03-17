import { extractLocaleFromUrl } from "./extract-locale-from-url.js";
import { getLocale } from "./get-locale.js";
import { getUrlOrigin } from "./get-url-origin.js";
import { isLocale } from "./is-locale.js";
import {
	baseLocale,
	TREE_SHAKE_DEFAULT_URL_PATTERN_USED,
	urlPatterns,
} from "./variables.js";

/**
 * Lower-level URL localization function, primarily used in server contexts.
 *
 * This function is designed for server-side usage where you need precise control
 * over URL localization, such as in middleware or request handlers. It works with
 * URL objects and always returns absolute URLs.
 *
 * For client-side UI components, use `localizeHref()` instead, which provides
 * a more convenient API with relative paths and automatic locale detection.
 *
 * @example
 * ```typescript
 * // Server middleware example
 * app.use((req, res, next) => {
 *   const url = new URL(req.url, `${req.protocol}://${req.headers.host}`);
 *   const localized = localizeUrl(url, { locale: "de" });
 *
 *   if (localized.href !== url.href) {
 *     return res.redirect(localized.href);
 *   }
 *   next();
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Using with URL patterns
 * const url = new URL("https://example.com/about");
 * localizeUrl(url, { locale: "de" });
 * // => URL("https://example.com/de/about")
 *
 * // Using with domain-based localization
 * const url = new URL("https://example.com/store");
 * localizeUrl(url, { locale: "de" });
 * // => URL("https://de.example.com/store")
 * ```
 *
 * @param {string | URL} url - The URL to localize. If string, must be absolute.
 * @param {Object} [options] - Options for localization
 * @param {string} [options.locale] - Target locale. If not provided, uses getLocale()
 * @returns {URL} The localized URL, always absolute
 */
export function localizeUrl(url, options) {
	if (TREE_SHAKE_DEFAULT_URL_PATTERN_USED) {
		return localizeUrlDefaultPattern(url, options);
	}

	const targetLocale = options?.locale ?? getLocale();
	const urlObj = typeof url === "string" ? new URL(url) : url;

	// Iterate over URL patterns
	for (const element of urlPatterns) {
		// match localized patterns
		for (const [, localizedPattern] of element.localized) {
			const match = new URLPattern(localizedPattern, urlObj.href).exec(
				urlObj.href
			);

			if (!match) {
				continue;
			}

			const targetPattern = element.localized.find(
				([locale]) => locale === targetLocale
			)?.[1];

			if (!targetPattern) {
				continue;
			}

			const localizedUrl = fillPattern(
				targetPattern,
				aggregateGroups(match),
				urlObj.origin
			);
			return fillMissingUrlParts(localizedUrl, match);
		}
		const unlocalizedMatch = new URLPattern(element.pattern, urlObj.href).exec(
			urlObj.href
		);
		if (unlocalizedMatch) {
			const targetPattern = element.localized.find(
				([locale]) => locale === targetLocale
			)?.[1];
			if (targetPattern) {
				const localizedUrl = fillPattern(
					targetPattern,
					aggregateGroups(unlocalizedMatch),
					urlObj.origin
				);
				return fillMissingUrlParts(localizedUrl, unlocalizedMatch);
			}
		}
	}
	// If no match found, return the original URL
	return urlObj;
}

/**
 * https://github.com/opral/inlang-paraglide-js/issues/381
 *
 * @param {string | URL} url
 * @param {Object} [options]
 * @param {string} [options.locale]
 * @returns {URL}
 */
function localizeUrlDefaultPattern(url, options) {
	const urlObj =
		typeof url === "string" ? new URL(url, getUrlOrigin()) : new URL(url);

	const locale = options?.locale ?? getLocale();
	const currentLocale = extractLocaleFromUrl(urlObj);

	// If current locale matches target locale, no change needed
	if (currentLocale === locale) {
		return urlObj;
	}

	const pathSegments = urlObj.pathname.split("/").filter(Boolean);

	// If current path starts with a locale, remove it
	if (pathSegments.length > 0 && isLocale(pathSegments[0])) {
		pathSegments.shift();
	}

	// For base locale, don't add prefix
	if (locale === baseLocale) {
		urlObj.pathname = "/" + pathSegments.join("/");
	} else {
		// For other locales, add prefix
		urlObj.pathname = "/" + locale + "/" + pathSegments.join("/");
	}

	return urlObj;
}

/**
 * Low-level URL de-localization function, primarily used in server contexts.
 *
 * This function is designed for server-side usage where you need precise control
 * over URL de-localization, such as in middleware or request handlers. It works with
 * URL objects and always returns absolute URLs.
 *
 * For client-side UI components, use `deLocalizeHref()` instead, which provides
 * a more convenient API with relative paths.
 *
 * @example
 * ```typescript
 * // Server middleware example
 * app.use((req, res, next) => {
 *   const url = new URL(req.url, `${req.protocol}://${req.headers.host}`);
 *   const baseUrl = deLocalizeUrl(url);
 *
 *   // Store the base URL for later use
 *   req.baseUrl = baseUrl;
 *   next();
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Using with URL patterns
 * const url = new URL("https://example.com/de/about");
 * deLocalizeUrl(url); // => URL("https://example.com/about")
 *
 * // Using with domain-based localization
 * const url = new URL("https://de.example.com/store");
 * deLocalizeUrl(url); // => URL("https://example.com/store")
 * ```
 *
 * @param {string | URL} url - The URL to de-localize. If string, must be absolute.
 * @returns {URL} The de-localized URL, always absolute
 */
export function deLocalizeUrl(url) {
	if (TREE_SHAKE_DEFAULT_URL_PATTERN_USED) {
		return deLocalizeUrlDefaultPattern(url);
	}

	const urlObj = typeof url === "string" ? new URL(url) : url;

	// Iterate over URL patterns
	for (const element of urlPatterns) {
		// Iterate over localized versions
		for (const [, localizedPattern] of element.localized) {
			const match = new URLPattern(localizedPattern, urlObj.href).exec(
				urlObj.href
			);

			if (match) {
				// Convert localized URL back to the base pattern
				const groups = aggregateGroups(match);

				const baseUrl = fillPattern(element.pattern, groups, urlObj.origin);
				return fillMissingUrlParts(baseUrl, match);
			}
		}
		// match unlocalized pattern
		const unlocalizedMatch = new URLPattern(element.pattern, urlObj.href).exec(
			urlObj.href
		);
		if (unlocalizedMatch) {
			const baseUrl = fillPattern(
				element.pattern,
				aggregateGroups(unlocalizedMatch),
				urlObj.origin
			);
			return fillMissingUrlParts(baseUrl, unlocalizedMatch);
		}
	}
	// no match found return the original url
	return urlObj;
}

/**
 * De-localizes a URL using the default pattern (/:locale/*)
 * @param {string|URL} url
 * @returns {URL}
 */
function deLocalizeUrlDefaultPattern(url) {
	const urlObj =
		typeof url === "string" ? new URL(url, getUrlOrigin()) : new URL(url);
	const pathSegments = urlObj.pathname.split("/").filter(Boolean);

	// If first segment is a locale, remove it
	if (pathSegments.length > 0 && isLocale(pathSegments[0])) {
		urlObj.pathname = "/" + pathSegments.slice(1).join("/");
	}

	return urlObj;
}

/**
 * Takes matches of implicit wildcards in the UrlPattern (when a part is missing
 * it is equal to '*') and adds them back to the result of fillPattern.
 *
 * At least protocol and hostname are required to create a valid URL inside fillPattern.
 *
 * @param {URL} url
 * @param {any} match
 * @returns {URL}
 */
function fillMissingUrlParts(url, match) {
	if (match.protocol.groups["0"]) {
		url.protocol = match.protocol.groups["0"] ?? "";
	}
	if (match.hostname.groups["0"]) {
		url.hostname = match.hostname.groups["0"] ?? "";
	}
	if (match.username.groups["0"]) {
		url.username = match.username.groups["0"] ?? "";
	}
	if (match.password.groups["0"]) {
		url.password = match.password.groups["0"] ?? "";
	}
	if (match.port.groups["0"]) {
		url.port = match.port.groups["0"] ?? "";
	}
	if (match.pathname.groups["0"]) {
		url.pathname = match.pathname.groups["0"] ?? "";
	}
	if (match.search.groups["0"]) {
		url.search = match.search.groups["0"] ?? "";
	}
	if (match.hash.groups["0"]) {
		url.hash = match.hash.groups["0"] ?? "";
	}

	return url;
}

/**
 * Fills a URL pattern with values for named groups, supporting all URLPattern-style modifiers.
 *
 * This function will eventually be replaced by https://github.com/whatwg/urlpattern/issues/73
 *
 * Matches:
 * - :name        -> Simple
 * - :name?       -> Optional
 * - :name+       -> One or more
 * - :name*       -> Zero or more
 * - :name(...)   -> Regex group
 * - {text}       -> Group delimiter
 * - {text}?      -> Optional group delimiter
 *
 * If the value is `null`, the segment is removed.
 *
 * @param {string} pattern - The URL pattern containing named groups.
 * @param {Record<string, string | null | undefined>} values - Object of values for named groups.
 * @param {string} origin - Base URL to use for URL construction.
 * @returns {URL} - The constructed URL with named groups filled.
 */
function fillPattern(pattern, values, origin) {
	// Pre-process the pattern to handle explicit port numbers
	// This detects patterns like "http://localhost:5173" and protects the port number
	// from being interpreted as a parameter
	let processedPattern = pattern.replace(
		/(https?:\/\/[^:/]+):(\d+)(\/|$)/g,
		(_, protocol, port, slash) => {
			// Replace ":5173" with "#PORT-5173#" to protect it from parameter replacement
			return `${protocol}#PORT-${port}#${slash}`;
		}
	);

	// First, handle group delimiters with curly braces
	let processedGroupDelimiters = processedPattern.replace(
		/\{([^{}]*)\}([?+*]?)/g,
		(_, content, modifier) => {
			// For optional group delimiters
			if (modifier === "?") {
				// For optional groups, we'll include the content
				return content;
			}
			// For non-optional group delimiters, always include the content
			return content;
		}
	);

	// Then handle named groups
	let filled = processedGroupDelimiters.replace(
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

	// Restore port numbers
	filled = filled.replace(/#PORT-(\d+)#/g, ":$1");

	return new URL(filled, origin);
}

/**
 * Aggregates named groups from various parts of the URLPattern match result.
 *
 *
 * @type {(match: any) => Record<string, string | null | undefined>}
 */
export function aggregateGroups(match) {
	return {
		...match.hash.groups,
		...match.hostname.groups,
		...match.password.groups,
		...match.pathname.groups,
		...match.port.groups,
		...match.protocol.groups,
		...match.search.groups,
		...match.username.groups,
	};
}
