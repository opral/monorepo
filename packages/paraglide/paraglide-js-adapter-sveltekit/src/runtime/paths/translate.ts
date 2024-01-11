import { base } from "$app/paths"

/**
 * Maps canonical paths to translations for each language.
 *
 * @example
 * ```json
 * {
 *   "/": {
 *    "en": "/",
 *    "de": "/de"
 *   },
 *   "/about": {
 *     "en": "/about",
 *     "de": "/ueber-uns"
 *   },
 *   "/admin/users/[id]": {
 *     "en": "/admin/users/[id]",
 *     "de": "/admin/benutzer/[id]"
 *   }
 * }
 * ```
 */
type PathTranslations = {
	[canonicalPath: string]: {
		[languageTag: string]: string
	}
}

export function getCanonicalPath(pathWithBase: string, translations: PathTranslations): string {
	const pathWithLanguage = pathWithBase.slice(base.length)
	const { lang, path } = parsePathWithLanguage(pathWithLanguage)

	let resolvedPath = path
	for (const [canonicalPath, translationsForPath] of Object.entries(translations)) {
		if (!(lang in translationsForPath)) continue
		if (translationsForPath[lang] === path) {
			resolvedPath = canonicalPath
			break
		}
	}

	if (base) resolvedPath = normalizePath(base) + normalizePath(resolvedPath)
	return resolvedPath
}

function parsePathWithLanguage(pathWithLanguage: string): { lang: string; path: string } {
	const [lang, ...parts] = pathWithLanguage.split("/").filter(Boolean)

	const path = normalizePath(parts.join("/"))

	return lang
		? {
				lang,
				path,
		  }
		: {
				lang: "",
				path: "/",
		  }
}

/**
 * Always starts with a slash and never ends with a slash.
 */
function normalizePath(path: string) {
	if (!path.startsWith("/")) path = "/" + path
	if (path.endsWith("/")) path = path.slice(0, -1)
	return path
}
