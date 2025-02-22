import { getLocale } from "./get-locale.js";
import { getUrlOrigin } from "./get-url-origin.js";
import { deLocalizeUrl, localizeUrl } from "./localize-url.js";

/**
 * Localizes an href.
 *
 * In contrast to `localizeUrl()`, this function automatically
 * calls `getLocale()` to determine the target locale and
 * returns a relative path if appropriate.
 *
 * @example
 *   localizeHref("/about")
 *   // => "/de/about"
 *
 *   // requires full URL and locale
 *   localizeUrl("http://example.com/about", { locale: "de" })
 *   // => "http://example.com/de/about"
 *
 * @param {string} href
 * @param {Object} [options] - Options
 * @param {string} [options.locale] - The target locale.
 */
export function localizeHref(href, options) {
	const locale = options?.locale ?? getLocale();
	const url = new URL(href, getUrlOrigin());

	const localized = localizeUrl(url, { locale });

	// if the origin is identical and the href is relative,
	// return the relative path
	if (href.startsWith("/") && url.origin === localized.origin) {
		// check for cross origin localization in which case an absolute URL must be returned.
		if (locale !== getLocale()) {
			const localizedCurrentLocale = localizeUrl(url, { locale: getLocale() });
			if (localizedCurrentLocale.origin !== localized.origin) {
				return localized.href;
			}
		}
		return localized.pathname + localized.search + localized.hash;
	}

	return localized.href;
}

/**
 * De-localizes an href.
 *
 * In contrast to `deLocalizeUrl()`, this function automatically
 * calls `getLocale()` to determine the base locale and
 * returns a relative path if appropriate.
 *
 * @example
 *   deLocalizeHref("/de/about")
 *   // => "/about"
 *
 *   // requires full URL and locale
 *   deLocalizeUrl("http://example.com/de/about")
 *   // => "http://example.com/about"
 *
 * @param {string} href
 * @returns {string} - The de-localized href.
 */
export function deLocalizeHref(href) {
	const url = new URL(href, getUrlOrigin());

	const deLocalized = deLocalizeUrl(url);

	// If the origin is identical and the href is relative,
	// return the relative path instead of the full URL.
	if (href.startsWith("/") && url.origin === deLocalized.origin) {
		return deLocalized.pathname + deLocalized.search + deLocalized.hash;
	}

	return deLocalized.href;
}