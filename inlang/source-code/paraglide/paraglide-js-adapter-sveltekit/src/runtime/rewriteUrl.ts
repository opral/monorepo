import { isAvailableLanguageTag, sourceLanguageTag } from "$paraglide-adapter-sveltekit:runtime"
import { getLanguageFromURL } from "./getLanguageFromUrl.js"

type RewriteUrl = (event: { url: URL }) => URL

type AbsolutePath = `/${string}`
type SlugTranslations = Record<string, Record<AbsolutePath, AbsolutePath>>

export function i18nRewrites(slugTranslations: SlugTranslations): RewriteUrl {
	return ({ url }) => {
		const language = getLanguageFromURL(url) ?? sourceLanguageTag
		url.pathname = removeLanguageFromPath(url.pathname)

		if (language in slugTranslations) return url

		if (url.pathname in slugTranslations[language]!) {
			url.pathname = slugTranslations[language]![url.pathname as AbsolutePath]!
		}

		return url
	}
}

function removeLanguageFromPath(path: string): string {
	const [maybeLanguage, ...rest] = path.split("/").filter(Boolean)
	return isAvailableLanguageTag(maybeLanguage) ? rest.join("/") : path
}
