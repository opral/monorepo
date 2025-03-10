import { localizeUrl } from "./localize-url.js";
import {
	locales,
	baseLocale,
	TREE_SHAKE_DEFAULT_URL_PATTERN_USED,
	urlPatterns,
} from "./variables.js";

/**
 * Generates a list of localized URLs for all provided URLs.
 *
 * This is useful for SSG (Static Site Generation) and sitemap generation.
 * NextJS and other frameworks use this function for SSG.
 *
 * @example
 * ```typescript
 * const urls = generateStaticLocalizedUrls([
 *   "https://example.com/about",
 *   "https://example.com/blog",
 * ]);
 * urls[0].href // => "https://example.com/about"
 * urls[1].href // => "https://example.com/blog"
 * urls[2].href // => "https://example.com/de/about"
 * urls[3].href // => "https://example.com/de/blog"
 * ...
 * ```
 *
 * @param {(string | URL)[]} urls - List of URLs to generate localized versions for. Can be absolute URLs or paths.
 * @returns {URL[]} List of localized URLs as URL objects
 */
export function generateStaticLocalizedUrls(urls) {
	const localizedUrls = new Set();

	// For default URL pattern, we can optimize the generation
	if (TREE_SHAKE_DEFAULT_URL_PATTERN_USED) {
		for (const urlInput of urls) {
			const url =
				urlInput instanceof URL
					? urlInput
					: new URL(urlInput, "http://localhost");

			// Base locale doesn't get a prefix
			localizedUrls.add(url);

			// Other locales get their code as prefix
			for (const locale of locales) {
				if (locale !== baseLocale) {
					const localizedPath = `/${locale}${url.pathname}${url.search}${url.hash}`;
					const localizedUrl = new URL(localizedPath, url.origin);
					localizedUrls.add(localizedUrl);
				}
			}
		}
		return Array.from(localizedUrls);
	}

	// For custom URL patterns, we need to use localizeUrl for each URL and locale
	for (const urlInput of urls) {
		const url =
			urlInput instanceof URL
				? urlInput
				: new URL(urlInput, "http://localhost");

		// Try each URL pattern to find one that matches
		let patternFound = false;
		for (const pattern of urlPatterns) {
			try {
				// Try to match the unlocalized pattern
				const unlocalizedMatch = new URLPattern(pattern.pattern, url.href).exec(
					url.href
				);

				if (!unlocalizedMatch) continue;

				patternFound = true;

				// Track unique localized URLs to avoid duplicates when patterns are the same
				const seenUrls = new Set();

				// Generate localized URL for each locale
				for (const [locale] of pattern.localized) {
					try {
						const localizedUrl = localizeUrl(url, { locale });
						const urlString = localizedUrl.href;

						// Only add if we haven't seen this exact URL before
						if (!seenUrls.has(urlString)) {
							seenUrls.add(urlString);
							localizedUrls.add(localizedUrl);
						}
					} catch {
						// Skip if localization fails for this locale
						continue;
					}
				}
				break;
			} catch {
				// Skip if pattern matching fails
				continue;
			}
		}

		// If no pattern matched, use the URL as is
		if (!patternFound) {
			localizedUrls.add(url);
		}
	}

	return Array.from(localizedUrls);
}
