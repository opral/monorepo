// Vendored in from https://github.com/jshttp/negotiator
// Rewritten in Typescript & annotated by Loris Sigrist

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
	 * The full BCP 47 of the language
	 * @example "en-GB"
	 */
	full: string
}

/**
 * Information about the priority of a language that's available in the app relative to that
 * of the language in the Accept-Language header
 */
type LanguagePriority<T extends string = string> = {
	/**
	 * The available language tag which is being considered
	 */
	languageTag: T

	/**
	 * The index of the languageTag among the available languages
	 */
	index: number

	/**
	 * The quality of the language as specified in the Accept-Language header.
	 * Between 0 and 1
	 *
	 * Some code uses the value -1 here to signal "no match"
	 *
	 * @default 1
	 */
	quality: number

	/**
	 * The index of the language in the Accept-Language header
	 * that was compared against when calculating the specificity.
	 */
	order: number

	/**
	 * The specificity measures how close the language is to the language in the Accept-Language header
	 *
	 * They act as a bitflag:
	 * 100 = exact match
	 * 010 = prefix match
	 * 001 = full match
	 *
	 * You can compare specificities by int-value, higher = better
	 */
	specificity: number
}

/**
 * Negotiates which of the provided language tags is preferred from an Accept-Language header
 *
 * @param accept The value of the Accept-Language header. If it's missing, it defaults to "*" as per RFC 2616 sec 14.4
 * @param availableLanguageTags The BCP 47 language tags that are available
 *
 * @returns The acceptable available language tags in descending order of preference
 */
export function negotiateLanguagePreferences<T extends string = string>(
	accept: string | undefined | null,
	availableLanguageTags: readonly T[]
): T[] {
	// No langauges are available -> nothing to negotiate
	if (availableLanguageTags.length === 0) return []

	// No accept-language header -> default to * as per RFC 2616 sec 14.4
	accept ||= "*"

	const acceptLanguageSpecs = parseAcceptLanguageHeader(accept)

	// compare each avaibale language to each language in the Accept-Language header
	// and find the one with the highest priority
	const priorities = availableLanguageTags.map((languageTag, index) =>
		getHighestLanguagePriority(languageTag, acceptLanguageSpecs, index)
	)

	// sorted list of accepted languages
	return priorities
		.filter((prio) => prio.quality > 0) //filter out all languages that didn't match any of the headers whatsoever
		.sort(comparePriorities) //sort them by their priority
		.map((priority) => priority.languageTag)
}

function parseAcceptLanguageHeader(acceptLanguage: string): LanguageSpec[] {
	const acceptableLanguageDefinitions = acceptLanguage.split(",")

	const specs = acceptableLanguageDefinitions
		.map((dfn) => dfn.trim())
		.map((dfn, index) => parseLanguage(dfn, index))
		.filter((maybeSpec): maybeSpec is LanguageSpec => Boolean(maybeSpec)) //filter out malformed entries

	return specs
}

/**
 * Parse a single language from the Accept-Language header.
 *
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
		if (key === "q" && value) return parseFloat(value)
	}
	return undefined
}

/**
 * Calculates the LanguagePriority of the availableLanguageTag
 * relative to all acceptableLanguages and returns the greatest one
 */
function getHighestLanguagePriority<T extends string>(
	/**
	 * A language tag that's available in the project
	 */
	availableLanguageTag: T,

	/**
	 * The langauges from the Accept-Language header
	 */
	acceptableLanguages: LanguageSpec[],

	/**
	 * The index of the available language among the available languages
	 */
	index: number
): LanguagePriority<T> {
	// The spec that matches the best
	// starts out as a default priority that will be overwritten by basically anything
	let highestPriority: LanguagePriority<T> = {
		languageTag: availableLanguageTag,
		index: 0,
		order: -1,
		quality: 0,
		specificity: 0,
	}

	for (const acceptableLanguage of acceptableLanguages) {
		const priority = calculatePriority(availableLanguageTag, acceptableLanguage, index)
		if (!priority) continue

		if (
			//compare the calculated priority to the highest priority ignoring quality.
			(highestPriority.specificity - priority.specificity ||
				highestPriority.quality - priority.quality ||
				highestPriority.order - priority.order) < 0
		) {
			highestPriority = priority
		}
	}

	return highestPriority
}

/**
 * Calculates the priority of an available language relative to an acceptable language
 * @param language A language that is available in the project
 * @param spec A parsed language from the Accept-Language header
 * @param index The index of the available language
 * @returns The priority of the language
 */
function calculatePriority<T extends string>(
	language: T,
	spec: LanguageSpec,
	index: number
): LanguagePriority<T> | undefined {
	const parsed = parseLanguage(language, 0)
	if (!parsed) return undefined

	let specificity = 0b000
	if (spec.full.toLowerCase() === parsed.full.toLowerCase()) {
		specificity |= 0b100
	} else if (spec.prefix.toLowerCase() === parsed.full.toLowerCase()) {
		specificity |= 0b010
	} else if (spec.full.toLowerCase() === parsed.prefix.toLowerCase()) {
		specificity |= 0b001
	}

	// if there is no specificity at all _and_ we're not considering a wildcard
	// then we bail
	if (specificity === 0 && spec.full !== "*") {
		return undefined
	}

	return {
		languageTag: language,
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
