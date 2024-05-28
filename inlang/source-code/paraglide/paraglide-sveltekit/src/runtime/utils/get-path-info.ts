import type { NormalizedBase } from "./normaliseBase.js"
import { safeDecode } from "./safe-decode.js"
import * as Path from "./path.js"

/** The path suffix SvelteKit adds on Data requests */
const DATA_SUFFIX = "__data.json"
const HTML_DATA_SUFFIX = ".html__data.json"

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

	const pathWithoutBase = removeBase(decodedPath, options.normalizedBase)

	const dataSuffix = pathWithoutBase.endsWith(HTML_DATA_SUFFIX)
		? HTML_DATA_SUFFIX
		: pathWithoutBase.endsWith(DATA_SUFFIX)
		? DATA_SUFFIX
		: undefined

	const pathWithoutDataSuffix =
		(dataSuffix ? pathWithoutBase.replace(dataSuffix, "") : pathWithoutBase) || "/"

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

	const pathSegment = Path.normalize(
		isAvailableLanguageTag ? rest.join("/") : pathWithoutDataSuffix
	)

	return {
		path: pathSegment,
		dataSuffix,
		trailingSlash,
		lang: detectedLanguage,
	}
}

function removeBase(absolutePath: string, normalizedBase: NormalizedBase): string {
	const withoutBase = absolutePath.replace(normalizedBase, "")
	return withoutBase.startsWith("/") ? withoutBase : `/${withoutBase}`
}
