import * as Path from "../utils/path.js"
import type { PathTranslations } from "./path-translations.js"

export function getCanonicalPath(
	path: string,
	lang: string,
	translations: PathTranslations<string>
): string {
	let resolvedPath = path
	for (const [canonicalPath, translationsForPath] of Object.entries(translations)) {
		if (!(lang in translationsForPath)) continue
		if (translationsForPath[lang] === path) {
			resolvedPath = canonicalPath
			break
		}
	}

	return resolvedPath
}
