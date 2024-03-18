import * as Path from "./path.js"
import { DATA_SUFFIX } from "../../constants.js"

/**
 * Serializes a path with the given options. Does **NOT** include the language.
 */
export function serializeRoute(opts: SerializePathOptions): string {
	const parts: string[] = []

	parts.push(opts.base)

	if (opts.includeLanguage) {
		const isDefaultLanguage = opts.lang === opts.defaultLanguageTag
		if (!isDefaultLanguage || opts.prefixDefaultLanguage === "always") {
			parts.push(opts.lang)
		}
	}

	parts.push(opts.path)

	if (opts.dataSuffix) parts.push(DATA_SUFFIX)
	return Path.resolve(...parts) + (opts.trailingSlash && !opts.dataSuffix ? "/" : "")
}

type SerializePathOptions = {
	path: string
	base: string
	dataSuffix: string | undefined
	trailingSlash: boolean
} & (
	| { includeLanguage: false }
	| {
			includeLanguage: true
			lang: string
			defaultLanguageTag: string
			prefixDefaultLanguage: "always" | "never"
	  }
)
