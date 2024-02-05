import {
	isAvailableLanguageTag,
	setLanguageTag,
	sourceLanguageTag,
} from "paraglide-js-adapter-astro:runtime"
import { getLocaleByPath } from "astro:i18n"
import type { MiddlewareHandler } from "astro"

export const onRequest: MiddlewareHandler = ({ url, locals, site }, next) => {
	const locale = getLangFromPath(url.pathname)

	locals.paraglide = {
		lang: locale,
		dir: "ltr",
	}

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
