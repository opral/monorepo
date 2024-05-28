import type { NormalizedBase } from "./normaliseBase.js"
import { DATA_SUFFIX, HTML_DATA_SUFFIX } from "../../constants.js"
import { safeDecode } from "./safe-decode.js"
import * as Path from "./path.js"

type ParseOptions<T extends string> = {
	normalizedBase: NormalizedBase
	availableLanguageTags: readonly T[]
	defaultLanguageTag: T
}

type ParseResult<T extends string> = {
	lang: T
	path: string
	trailingSlash: boolean
	dataSuffix: string | undefined
}

/**
 * Takes a path and turns it into the relevant parts
 * @param path
 * @param base
 */
export function getPathInfo<T extends string>(
	path: string,
	options: ParseOptions<T>
): ParseResult<T> {
	const decodedPath = safeDecode(path)
	const trailingSlash = decodedPath.endsWith("/") && decodedPath !== "/"

	const normalizedPath = Path.normalize(decodedPath)
	const pathWithoutBase = removeBase(normalizedPath, options.normalizedBase)

	const dataSuffix = pathWithoutBase.endsWith(HTML_DATA_SUFFIX)
		? HTML_DATA_SUFFIX
		: pathWithoutBase.endsWith(DATA_SUFFIX)
		? DATA_SUFFIX
		: undefined

	const pathWithoutDataSuffix = dataSuffix
		? pathWithoutBase.replace(dataSuffix, "")
		: pathWithoutBase

	const [maybeLang, ...rest] = pathWithoutDataSuffix.split("/").filter(Boolean)

	if (!maybeLang) {
		return {
			lang: options.defaultLanguageTag,
			path: "/",
			dataSuffix,
			trailingSlash,
		}
	}

	const isAvailableLanguageTag = options.availableLanguageTags.includes(maybeLang as any)

	const detectedLanguage = isAvailableLanguageTag ? (maybeLang as T) : options.defaultLanguageTag

	const pathSegment = isAvailableLanguageTag
		? Path.normalize(rest.join("/"))
		: Path.normalize(pathWithoutDataSuffix)

	return {
		path: pathSegment,
		dataSuffix,
		trailingSlash,
		lang: detectedLanguage,
	}
}

function removeBase(path: string, normalizedBase: NormalizedBase): string {
	return path.replace(normalizedBase, "")
}
