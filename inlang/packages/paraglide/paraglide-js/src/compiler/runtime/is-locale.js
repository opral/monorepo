import { locales } from "./variables.js";

/**
 * Check if something is an available locale.
 *
 * @example
 *   if (isLocale(params.locale)) {
 *     setLocale(params.locale);
 *   } else {
 *     setLocale('en');
 *   }
 *
 * @param {any} locale
 * @returns {locale is Locale}
 */
export function isLocale(locale) {
	if (typeof locale !== "string") return false;
	return !locale
		? false
		: locales.some((item) => item.toLowerCase() === locale.toLowerCase());
}
