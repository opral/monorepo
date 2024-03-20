import {
	isAvailableLanguageTag,
	setLanguageTag,
	sourceLanguageTag,
} from "paraglide-js-adapter-astro:runtime"
import type { MiddlewareHandler, Locales } from "astro"

export const onRequest: MiddlewareHandler = async (
	{ url, locals, currentLocale, preferredLocales },
	next
) => {
	const locale = currentLocale ?? getLangFromPath(url.pathname)
	const dir = guessTextDirection(locale)

	const astroI18n = await maybeGetAstroI18n()

	console.log(astroI18n)

	locals.paraglide = {
		lang: locale,
		dir,
	}

	setLanguageTag(locale)
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

async function maybeGetAstroI18n(): Promise<typeof import("astro:i18n") | undefined> {
	try {
		return await import("astro:i18n")
	} catch (e) {
		return undefined
	}
}

/**
 * Copied from Astro's built-in language negotiation.
 *
 * @see https://github.com/withastro/astro/blob/17b4991cffb2f16fb3deba5881c54fa67c9ee9ce/packages/astro/src/i18n/utils.ts#L155
 */
function computeCurrentLocale(pathname: string, locales: Locales): undefined | string {
	for (const segment of pathname.split("/")) {
		for (const locale of locales) {
			if (typeof locale === "string") {
				// we skip a locale that isn't present in the current segment

				if (!segment.includes(locale)) continue
				if (normalizeLocale(locale) === normalizeLocale(segment)) {
					return locale
				}
			} else {
				if (locale.path === segment) {
					return locale.codes.at(0)
				} else {
					for (const code of locale.codes) {
						if (normalizeLocale(code) === normalizeLocale(segment)) {
							return code
						}
					}
				}
			}
		}
	}

	return undefined
}

function normalizeLocale(locale: string): string {
	return locale.replaceAll("_", "-").toLowerCase()
}
