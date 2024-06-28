import {
	isAvailableLanguageTag,
	setLanguageTag,
	sourceLanguageTag,
} from "virtual:paraglide-astro:runtime"
import { type MiddlewareHandler } from "astro"
import { AsyncLocalStorage } from "node:async_hooks"

const localeStorage = new AsyncLocalStorage<string>()

export const onRequest: MiddlewareHandler = async ({ url, locals, currentLocale }, next) => {
	setLanguageTag(() => {
		const maybeLang = localeStorage.getStore()
		return maybeLang ?? sourceLanguageTag
	})

	const locale = currentLocale ?? getLangFromPath(url.pathname)
	const dir = guessTextDirection(locale)

	/** @deprecated */
	locals.paraglide = {
		lang: locale,
		dir,
	}

	return await localeStorage.run(locale, next)
}

function getLangFromPath(path: string) {
	// TODO consider base path

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
