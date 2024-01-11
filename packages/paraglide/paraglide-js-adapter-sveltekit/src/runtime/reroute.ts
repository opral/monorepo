import type { Reroute } from "@sveltejs/kit"
import type { PathTranslations } from "./translate-paths/path-translations.js"
import * as Path from "./utils/path.js"
import { getCanonicalPath } from "./index.js"

const DATA_SUFFIX = "/__data.json"

/**
 * Returns a reroute function that applies the given translations to the paths
 * @param translations
 */
export const reroute = (translations: PathTranslations<string>): Reroute => {
	return ({ url }) => {
		const isDataRequest = url.pathname.endsWith(DATA_SUFFIX)

		const path = isDataRequest ? url.pathname.slice(0, -DATA_SUFFIX.length) : url.pathname
		const resolvedPath = getCanonicalPath(path, translations)

		return isDataRequest ? Path.resolve(resolvedPath, DATA_SUFFIX) : resolvedPath
	}
}
