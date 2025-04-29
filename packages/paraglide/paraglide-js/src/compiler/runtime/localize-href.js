import { getLocale } from "./get-locale.js";
import { getUrlOrigin } from "./get-url-origin.js";
import { deLocalizeUrl, localizeUrl } from "./localize-url.js";

/**
 * High-level URL localization function optimized for client-side UI usage.
 *
 * This is a convenience wrapper around `localizeUrl()` that provides features
 * needed in UI:
 *
 * - Accepts relative paths (e.g., "/about")
 * - Returns relative paths when possible
 * - Automatically detects current locale if not specified
 * - Handles string input/output instead of URL objects
 *
 * @example
 * ```typescript
 * // In a React/Vue/Svelte component
 * const NavLink = ({ href }) => {
 *   // Automatically uses current locale, keeps path relative
 *   return <a href={localizeHref(href)}>...</a>;
 * };
 *
 * // Examples:
 * localizeHref("/about")
 * // => "/de/about" (if current locale is "de")
 * localizeHref("/store", { locale: "fr" })
 * // => "/fr/store" (explicit locale)
 *
 * // Cross-origin links remain absolute
 * localizeHref("https://other-site.com/about")
 * // => "https://other-site.com/de/about"
 * ```
 *
 * For server-side URL localization (e.g., in middleware), use `localizeUrl()`
 * which provides more precise control over URL handling.
 *
 * @param {string} href - The href to localize (can be relative or absolute)
 * @param {Object} [options] - Options for localization
 * @param {string} [options.locale] - Target locale. If not provided, uses `getLocale()`
 * @returns {string} The localized href, relative if input was relative
 */
export function localizeHref(href, options) {
	const currentLocale = getLocale();
	const locale = options?.locale ?? currentLocale;
	const url = new URL(href, getUrlOrigin());

	const localized = localizeUrl(url, { locale });

	// if the origin is identical and the href is relative,
	// return the relative path
	if (href.startsWith("/") && url.origin === localized.origin) {
		// check for cross origin localization in which case an absolute URL must be returned.
		if (locale !== currentLocale) {
			const localizedCurrentLocale = localizeUrl(url, { locale: currentLocale });
			if (localizedCurrentLocale.origin !== localized.origin) {
				return localized.href;
			}
		}
		return localized.pathname + localized.search + localized.hash;
	}

	return localized.href;
}

/**
 * High-level URL de-localization function optimized for client-side UI usage.
 *
 * This is a convenience wrapper around `deLocalizeUrl()` that provides features
 * needed in the UI:
 *
 * - Accepts relative paths (e.g., "/de/about")
 * - Returns relative paths when possible
 * - Handles string input/output instead of URL objects
 *
 * @example
 * ```typescript
 * // In a React/Vue/Svelte component
 * const LocaleSwitcher = ({ href }) => {
 *   // Remove locale prefix before switching
 *   const baseHref = deLocalizeHref(href);
 *   return locales.map(locale =>
 *     <a href={localizeHref(baseHref, { locale })}>
 *       Switch to {locale}
 *     </a>
 *   );
 * };
 *
 * // Examples:
 * deLocalizeHref("/de/about")  // => "/about"
 * deLocalizeHref("/fr/store")  // => "/store"
 *
 * // Cross-origin links remain absolute
 * deLocalizeHref("https://example.com/de/about")
 * // => "https://example.com/about"
 * ```
 *
 * For server-side URL de-localization (e.g., in middleware), use `deLocalizeUrl()`
 * which provides more precise control over URL handling.
 *
 * @param {string} href - The href to de-localize (can be relative or absolute)
 * @returns {string} The de-localized href, relative if input was relative
 * @see deLocalizeUrl - For low-level URL de-localization in server contexts
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
