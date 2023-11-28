import {
	sourceLanguageTag,
	availableLanguageTags,
	type AvailableLanguageTag,
} from "$paraglide/runtime"

/**
 * A user-defined utility function
 * @param path
 * @param lang
 * @returns
 */
export function translatePath(path: string, lang: string) {
	if (lang === sourceLanguageTag) return path
	else return `/${lang}${path}`
}

export function getPathWithoutLang(path: string) {
	const [_, maybeLang, ...rest] = path.split("/")
	if (availableLanguageTags.includes(maybeLang as any)) return `/${rest.join("/")}`
	else return path
}

export function getTextDirection(locale: AvailableLanguageTag) {
	const directions: Record<AvailableLanguageTag, "ltr" | "rtl"> = {
		en: "ltr",
		de: "ltr",
	}

	return directions[locale]
}
