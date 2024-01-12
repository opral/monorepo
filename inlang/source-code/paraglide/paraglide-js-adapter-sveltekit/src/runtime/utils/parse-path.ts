import { DATA_SUFFIX } from "../constants.js"
import * as Path from "./path.js"

type ParseOptions = {
	base: string
	availableLanguageTags: readonly string[]
	defaultLanguageTag: string
}

type ParseResult = {
	base: string
	lang: string
	canonicalPath: string
	isDataRequest: boolean
}

/**
 * Takes a path and turns it into the relevant parts
 * @param path
 * @param base
 */
export function parsePath(path: string, options: ParseOptions): ParseResult {
	path = Path.normalize(path)
	const base = Path.normalize(options.base)
	const { availableLanguageTags, defaultLanguageTag } = options

	let pathWithoutBase = path.replace(base, "/")

	const isDataRequest = pathWithoutBase.endsWith(DATA_SUFFIX)
	if (isDataRequest) {
		pathWithoutBase = pathWithoutBase.replace(DATA_SUFFIX, "")
	}

	const [maybeLang, ...rest] = pathWithoutBase.split("/").filter(Boolean)

	if (!maybeLang) {
		return { base, lang: defaultLanguageTag, canonicalPath: "/", isDataRequest }
	}

	const canonicalPath = availableLanguageTags.includes(maybeLang as any)
		? Path.normalize(rest.join("/"))
		: Path.normalize(pathWithoutBase)

	const lang = availableLanguageTags.includes(maybeLang as any) ? maybeLang : defaultLanguageTag

	return { base, lang, canonicalPath, isDataRequest }
}
