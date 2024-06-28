import {
	isAvailableLanguageTag,
	setLanguageTag,
	sourceLanguageTag,
} from "virtual:paraglide-astro:runtime"
import { type MiddlewareHandler } from "astro"
import { AsyncLocalStorage } from "node:async_hooks"

type NormalizedBase = `/${string}` | ""

declare global {
	interface ImportMeta {
		env: {
			/**
			 * The base URL set in the astro.config.
			 *
			 * May include a trailing slash.
			 * If no base is set, it defaults to "/".
			 */
			BASE_URL: string
		}
	}
}

const localeStorage = new AsyncLocalStorage<string>()

export const onRequest: MiddlewareHandler = async ({ url, locals, currentLocale }, next) => {
	setLanguageTag(() => {
		const maybeLang = localeStorage.getStore()
		return maybeLang ?? sourceLanguageTag
	})

	const normalizedBase = normalizeBase(import.meta.env.BASE_URL)
	const locale = currentLocale ?? getLangFromPath(url.pathname, normalizedBase) ?? sourceLanguageTag
	const dir = guessTextDirection(locale)

	/** @deprecated */
	locals.paraglide = {
		lang: locale,
		dir,
	}

	return await localeStorage.run(locale, next)
}

function normalizeBase(rawBase: string): NormalizedBase {
	if (rawBase === "/") return ""
	// if there is a trailing slash, remove it
	return (rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase) as NormalizedBase
}

function getLangFromPath(path: string, base: NormalizedBase): string | undefined {
	if (!path.startsWith(base)) return undefined

	const withoutBasePath = path.replace(base, "")
	const langOrPath = withoutBasePath.split("/").find(Boolean) // get the first segment
	return isAvailableLanguageTag(langOrPath) ? langOrPath : undefined
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
