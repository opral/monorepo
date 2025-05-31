import { isLocale } from "./is-locale.js";

/**
 * Negotiates a preferred language from navigator.languages.
 *
 * Use the function on the client to extract the locale
 * from the navigator.languages array.
 *
 * @example
 *   const locale = extractLocaleFromNavigator();
 *
 * @type {() => Locale | undefined}
 * @returns {string | undefined}
 */
export function extractLocaleFromNavigator() {
	if (!navigator?.languages?.length) {
		return undefined;
	}

	const languages = navigator.languages.map((lang) => ({
		fullTag: lang.toLowerCase(),
		baseTag: lang.split("-")[0]?.toLowerCase(),
	}));

	for (const lang of languages) {
		if (isLocale(lang.fullTag)) {
			return lang.fullTag;
		} else if (isLocale(lang.baseTag)) {
			return lang.baseTag;
		}
	}

	return undefined;
}
