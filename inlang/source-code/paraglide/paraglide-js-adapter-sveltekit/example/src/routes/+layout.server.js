import { base } from "$app/paths"
import { isAvailableLanguageTag, sourceLanguageTag } from "$paraglide/runtime.js"

export const prerender = true

/**
 * @param {string} pathWithBase
 */
function getLanguageFromPath(pathWithBase) {
	const pathWithLanguage = pathWithBase.slice(base.length)
	const [lang, ...parts] = pathWithLanguage.split("/").filter(Boolean)

	if (isAvailableLanguageTag(lang)) return lang
	return sourceLanguageTag
}

export function load({ url }) {
	const lang = getLanguageFromPath(url.pathname)
	return { lang }
}
