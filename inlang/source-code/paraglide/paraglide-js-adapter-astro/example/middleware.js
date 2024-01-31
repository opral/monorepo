import { isAvailableLanguageTag, sourceLanguageTag, setLanguageTag } from "$paraglide/runtime.js"

/**
 *
 * @param {{ url: URL }} config
 * @param {() => Response | Promise<Response>} next
 * @returns
 */
export function onRequest({ url }, next) {
	const locale = getLangFromPath(url.pathname)
	setLanguageTag(locale)
	return next()
}

/**
 * @param {string} path
 * @returns
 */
function getLangFromPath(path) {
	const [lang] = path.split("/").filter(Boolean)
	if (isAvailableLanguageTag(lang)) return lang
	return sourceLanguageTag
}
