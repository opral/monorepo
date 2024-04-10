// Vendored in from https://github.com/jshttp/negotiator

type LanguageSpec = {
	/**
	 * The index of the language in the Accept-Language header
	 */
	index: number

	/**
	 * The quality of the language as specified in the Accept-Language header.
	 * Between 0 and 1
	 * @default 1
	 */
	quality: number

	/**
	 * The language's prefix
	 * @example For "en-GB", the prefix is "en"
	 */
	prefix: string

	/**
	 * If the langauge has a suffix.
	 * @example For "en-GB", the suffix is "GB"
	 */
	suffix?: string

	/**
	 * The full definition of the language
	 * @example "en-GB"
	 */
	full: string
}

/**
 * Information about the priority of a language that's available in the app relative to that
 * of the language in the Accept-Language header
 */
type LanguagePriority = {
	/**
	 * The index of the language in the Accept-Language header
	 */
	index: number

	/**
	 * The quality of the language as specified in the Accept-Language header.
	 * Between 0 and 1
	 * @default 1
	 */
	quality: number

	/**
	 * The index of the language in the Accept-Language header
	 * that was compared against when calculating the specificity.
	 *
	 * Used as a tie-breaker when multiple languages have the same quality and specificity
	 */
	order: number

	/**
	 * The specificity of the language tag.
	 *
	 * You can compare specificities by value, but they also act as bitflags
	 * 100 = exact match
	 * 010 = prefix match
	 * 001 = full match
	 */
	specificity: number
}

/**
 * Negotiates which of the provided language tags is preferred from an Accept-Language header
 *
 * @throws If no language tags are provided
 */
export function negotiateLanguagePreferences<T extends string = string>(
	accept: string | undefined | null,
	availableLanguageTags: readonly T[]
): T[] {
	if (availableLanguageTags.length === 0) {
		throw new Error("No language tags available")
	}

	// RFC 2616 sec 14.4: no header = *
	const accepts = parseAcceptLanguageHeader(!accept ? "*" : accept)

	const priorities = availableLanguageTags.map((languageTag, index) =>
		getHighestLanguagePriority(languageTag, accepts, index)
	)

	// sorted list of accepted languages
	return priorities
		.filter((spec) => spec.quality > 0)
		.sort(comparePriorities)
		.map((priority) => availableLanguageTags[priorities.indexOf(priority)] as T)
}

function parseAcceptLanguageHeader(acceptLanguage: string): LanguageSpec[] {
	const acceptableLanguageDefinitions = acceptLanguage.split(",")

	const specs = acceptableLanguageDefinitions
		.map((acceptableLanguageDefinition, index) =>
			parseLanguage(acceptableLanguageDefinition.trim(), index)
		)
		.filter((maybeSpec): maybeSpec is LanguageSpec => Boolean(maybeSpec))

	return specs
}

/**
 * Parse a single language from the Accept-Language header.
 * @example
 * ```ts
 * parseLanguage("en-GB;q=0.8", 6) //{ prefix: "en", suffix: "GB", full: "en-GB", quality: 0.8, index: 6 }
 * ```
 *
 * @param str The string to parse
 * @param index The index of the language in the Accept-Language header
 */
function parseLanguage(str: string, index: number): LanguageSpec | undefined {
	const LANGUAGE_REGEXP = /^\s*([^\s\-;]+)(?:-([^\s;]+))?\s*(?:;(.*))?$/
	const match = LANGUAGE_REGEXP.exec(str)

	//Bail if the string is malformed
	if (!match) return undefined

	const [, prefix, suffix, qualityMatch] = match

	//shoud never happen given that the regex forces it to be there
	if (!prefix) throw new Error(`Invalid language tag: ${str}`)

	const full = suffix ? `${prefix}-${suffix}` : prefix

	/**
	 * If the language specifies a quality, parse it, otherwise default to 1
	 * as per RFC 2616
	 */
	const quality = qualityMatch ? parseQuality(qualityMatch) ?? 1 : 1

	return {
		prefix,
		suffix,
		quality,
		index,
		full,
	}
}

function parseQuality(qualityMatch: string): number | undefined {
	const params = qualityMatch.split(";")
	for (const param of params) {
		const [key, value] = param.split("=")
		if (!key || !value) continue
		if (key === "q") {
			return parseFloat(value)
		}
	}
	return undefined
}

/**
 * Calculates the LanguagePriority of the availableLanguageTag
 * relative to all acceptableLanguages and returns the greatest one
 */
function getHighestLanguagePriority(
	/**
	 * A language tag that's available in the project
	 */
	availableLanguageTag: string,

	/**
	 * The langauges from the Accept-Language header
	 */
	acceptableLanguages: LanguageSpec[],

	/**
	 * The index of the available language among the available languages
	 */
	index: number
): LanguagePriority {
	const DEFAULT_PRIORITY: LanguagePriority = {
		index: 0,
		order: -1,
		quality: 0,
		specificity: 0,
	}

	//find the spec that matches the best
	let highestPriority: LanguagePriority = DEFAULT_PRIORITY

	for (const acceptableLanguage of acceptableLanguages) {
		const spec = specify(availableLanguageTag, acceptableLanguage, index)
		if (!spec) continue

		if (
			(highestPriority.specificity - spec.specificity ||
				highestPriority.quality - spec.quality ||
				highestPriority.order - spec.order) < 0
		) {
			highestPriority = {
				index: spec.index,
				quality: spec.quality,
				order: spec.order,
				specificity: spec.specificity,
			}
		}
	}

	return highestPriority
}

/**
 * Get the priority of the language.
 */
function specify(
	language: string,
	spec: LanguageSpec,
	index: number
): LanguagePriority | undefined {
	const parsed = parseLanguage(language, 0)
	if (!parsed) return undefined

	/**
	 * Bitflag for the specificity
	 * 100 = exact match
	 * 010 = prefix match
	 * 001 = full match
	 */
	let specificity = 0
	// exact match
	if (spec.full.toLowerCase() === parsed.full.toLowerCase()) {
		specificity |= 4
	} else if (spec.prefix.toLowerCase() === parsed.full.toLowerCase()) {
		specificity |= 2
	} else if (spec.full.toLowerCase() === parsed.prefix.toLowerCase()) {
		specificity |= 1
	} else if (spec.full !== "*") {
		return undefined
	}

	return {
		index,
		order: spec.index,
		quality: spec.quality,
		specificity,
	}
}

function comparePriorities(a: LanguagePriority, b: LanguagePriority) {
	return (
		b.quality - a.quality ||
		b.specificity - a.specificity ||
		a.order - b.order ||
		a.index - b.index ||
		0
	)
}
