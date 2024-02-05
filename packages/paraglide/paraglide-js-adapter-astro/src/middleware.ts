import {
	isAvailableLanguageTag,
	setLanguageTag,
	sourceLanguageTag,
} from "paraglide-js-adapter-astro:runtime"
import { getPathByLocale, getLocaleByPath } from "astro:i18n"

export function onRequest({ url }: { url: URL }, next: () => Response | Promise<Response>) {
	const locale = getLangFromPath(url.pathname)
	setLanguageTag(locale)
	return next()
}

function getLangFromPath(path: string) {
	const [langOrPath] = path.split("/").filter(Boolean)
	if (isAvailableLanguageTag(langOrPath)) return langOrPath
	const langFromPath = getLocaleByPath(langOrPath || "")
	if (isAvailableLanguageTag(langFromPath)) return langFromPath
	return sourceLanguageTag
}
