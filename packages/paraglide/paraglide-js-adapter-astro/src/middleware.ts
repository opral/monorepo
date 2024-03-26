import {
	isAvailableLanguageTag,
	setLanguageTag,
	sourceLanguageTag,
} from "paraglide-js-adapter-astro:runtime"
import { type MiddlewareHandler } from "astro"

export const onRequest: MiddlewareHandler = async ({ url, locals, currentLocale }, next) => {
	const locale = currentLocale ?? getLangFromPath(url.pathname)
	const dir = guessTextDirection(locale)

	setLanguageTag(locale)

	locals.paraglide = {
		lang: locale,
		dir,
	}

	return await next()
}

function getLangFromPath(path: string) {
	const langOrPath = path.split("/").find(Boolean)
	if (isAvailableLanguageTag(langOrPath)) return langOrPath

	return sourceLanguageTag
}

function guessTextDirection(lang: string): "ltr" | "rtl" {
	try {
		const locale = new Intl.Locale(lang)

		// Node
		if ("textInfo" in locale) {
			// @ts-ignore
			return locale.textInfo.direction
		}

		// Spec compliant (future proofing)
		if ("getTextInfo" in locale) {
			// @ts-ignore
			return locale.getTextInfo().direction
		}

		// Fallback
		return "ltr"
	} catch (e) {
		return "ltr"
	}
}
