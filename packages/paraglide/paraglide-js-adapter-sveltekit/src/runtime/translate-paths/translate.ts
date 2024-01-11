import { base } from "$app/paths"
import * as Path from "../utils/path.js"
import type { PathTranslations } from "./path-translations.js"

export function getCanonicalPath(
	pathWithBase: string,
	translations: PathTranslations<string>
): string {
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

	if (base) resolvedPath = Path.resolve(base, resolvedPath)
	return resolvedPath
}

function parsePathWithLanguage(pathWithLanguage: string): { lang: string; path: string } {
	const [lang, ...parts] = pathWithLanguage.split("/").filter(Boolean)

	const path = Path.normalize(parts.join("/"))

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
