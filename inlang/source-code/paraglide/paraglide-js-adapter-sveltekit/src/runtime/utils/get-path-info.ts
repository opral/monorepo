import { DATA_SUFFIX, HTML_DATA_SUFFIX } from "../../constants.js"
import * as Path from "./path.js"
import { safeDecode } from "./safe-decode.js"

type ParseOptions = {
	base: string
	availableLanguageTags: readonly string[]
	defaultLanguageTag: string
}

type ParseResult = {
	base: string
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
	path = safeDecode(path)
	const trailingSlash = path.endsWith("/") && path !== "/"

	path = Path.normalize(path)
	const base = Path.normalize(options.base)
	const { availableLanguageTags, defaultLanguageTag } = options

	let pathWithoutBase = path.replace(base, "/")

	const dataSuffix = pathWithoutBase.endsWith(HTML_DATA_SUFFIX)
		? HTML_DATA_SUFFIX
		: pathWithoutBase.endsWith(DATA_SUFFIX)
		? DATA_SUFFIX
		: undefined

	if (dataSuffix) {
		pathWithoutBase = pathWithoutBase.replace(dataSuffix, "")
	}

	const [maybeLang, ...rest] = pathWithoutBase.split("/").filter(Boolean)

	if (!maybeLang) {
		return { base, lang: defaultLanguageTag, path: "/", dataSuffix, trailingSlash }
	}

	const lang = availableLanguageTags.includes(maybeLang as any) ? maybeLang : defaultLanguageTag
	const pathSegment = availableLanguageTags.includes(maybeLang as any)
		? Path.normalize(rest.join("/"))
		: Path.normalize(pathWithoutBase)

	return { base, lang, path: pathSegment, dataSuffix, trailingSlash }
}
