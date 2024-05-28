import type { NormalizedBase } from "./normaliseBase.js"
import { safeDecode } from "./safe-decode.js"
import * as Path from "./path.js"

/** The path suffix SvelteKit adds on Data requests */
const KNOWN_SUFFIXES = [".html__data.json", "__data.json"]

type ParseOptions<T extends string> = {
	normalizedBase: NormalizedBase
	availableLanguageTags: readonly T[]
}

type ParseResult<T extends string> = {
	languageTag: T | undefined
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

	const dataSuffix = KNOWN_SUFFIXES.find((suffix) => pathWithoutBase.endsWith(suffix))

	const pathWithoutDataSuffix =
		(dataSuffix ? pathWithoutBase.replace(dataSuffix, "") : pathWithoutBase) || "/"

	const [maybeLang, ...rest] = pathWithoutDataSuffix.split("/").filter(Boolean)

	const isAvailableLanguageTag = options.availableLanguageTags.includes(maybeLang as any)

	const detectedLanguage = isAvailableLanguageTag ? (maybeLang as T) : undefined

	const pathSegment = Path.normalize(
		isAvailableLanguageTag ? rest.join("/") : pathWithoutDataSuffix
	)

	return {
		path: pathSegment,
		dataSuffix,
		trailingSlash,
		languageTag: detectedLanguage,
	}
}

function removeBase(absolutePath: string, normalizedBase: NormalizedBase): string {
	const withoutBase = absolutePath.replace(normalizedBase, "")
	return withoutBase.startsWith("/") ? withoutBase : `/${withoutBase}`
}
