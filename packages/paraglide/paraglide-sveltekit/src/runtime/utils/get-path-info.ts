import type { NormalizedBase } from "./normaliseBase.js"
import { DATA_SUFFIX, HTML_DATA_SUFFIX } from "../../constants.js"
import { safeDecode } from "./safe-decode.js"
import * as Path from "./path.js"

type ParseOptions = {
	normalizedBase: NormalizedBase
	availableLanguageTags: readonly string[]
	defaultLanguageTag: string
}

type ParseResult = {
	lang: string
	path: string
	trailingSlash: boolean
	dataSuffix: string | undefined
}

/**
 * Takes a path and turns it into the relevant parts
 * @param path
 * @param base
 */
export function getPathInfo(path: string, options: ParseOptions): ParseResult {
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

	const lang = options.availableLanguageTags.includes(maybeLang as any)
		? maybeLang
		: options.defaultLanguageTag
	const pathSegment = options.availableLanguageTags.includes(maybeLang as any)
		? Path.normalize(rest.join("/"))
		: Path.normalize(pathWithoutDataSuffix)

	return {
		lang,
		path: pathSegment,
		dataSuffix,
		trailingSlash,
	}
}

function removeBase(path: string, normalizedBase: NormalizedBase): string {
	return path.replace(normalizedBase, "")
}
