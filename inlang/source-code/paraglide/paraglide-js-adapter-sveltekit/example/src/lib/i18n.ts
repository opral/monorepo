import type { AvailableLanguageTag } from "$paraglide/runtime"

/**
 * Look up the text direction for a given locale.
 * You could use a Polyfill for `Intl.Locale.prototype.getTextInfo` instead.
 */
export function getTextDirection(locale: AvailableLanguageTag) {
	const directions: Record<AvailableLanguageTag, "ltr" | "rtl"> = {
		en: "ltr",
		de: "ltr",
	}

	return directions[locale]
}
