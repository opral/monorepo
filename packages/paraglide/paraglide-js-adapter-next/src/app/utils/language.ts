/**
 * Vendored in from https://github.com/jshttp/negotiator
 */

type LanguageSpec = {
	index: number
	quality: number
	full: string
	prefix: string
	suffix: string
}

type LanguagePriority = {
	index: number
	order: number
	quality: number
	specificity: number
}

/**
 * Parse the Accept-Language header.
 */
function parseAcceptLanguage(acceptLanguage: string): LanguageSpec[] {
	const accepts = acceptLanguage.split(",")
	const specs: LanguageSpec[] = []

	for (const [i, accept] of accepts.entries()) {
		const language = parseLanguage(accept.trim(), i)
		if (language) specs.push(language)
	}

	return specs
}

/**
 * Parse a language from the Accept-Language header.
 */
function parseLanguage(str: string, index: number): LanguageSpec | undefined {
	const LANGUAGE_REGEXP = /^\s*([^\s\-;]+)(?:-([^\s;]+))?\s*(?:;(.*))?$/
	const match = LANGUAGE_REGEXP.exec(str)
	if (!match) return undefined

	const [, prefix, suffix, qualityMatch] = match
	const full = suffix ? `${prefix}-${suffix}` : prefix

	let quality = 1
	if (qualityMatch) {
		const params = qualityMatch.split(";")
		for (const param of params) {
			const p = param.split("=")
			if (p[0] === "q") quality = parseFloat(p[1])
		}
	}

	return {
		prefix: prefix,
		suffix: suffix,
		quality,
		index,
		full: full,
	}
}

/**
 * Get the priority of a language.
 */
function getLanguagePriority(
	language: string,
	accepted: LanguageSpec[],
	index: number
): LanguagePriority {
	//find the spec that matches the best
	let priority: LanguagePriority = { index: 0, order: -1, quality: 0, specificity: 0 }

	for (const element of accepted) {
		const spec = specify(language, element, index)
		if (!spec) continue

		if (
			(priority.specificity - spec.specificity ||
				priority.quality - spec.quality ||
				priority.order - spec.order) < 0
		) {
			priority = {
				index: spec.index,
				quality: spec.quality,
				order: spec.order,
				specificity: spec.specificity,
			}
		}
	}

	return priority
}

/**
 * Get the specificity of the language.
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

/**
 * Get the preferred languages from an Accept-Language header.
 * @public
 */
function preferredLanguages<T extends string = string>(
	accept: string | undefined,
	provided: readonly T[]
): T[] {
	// RFC 2616 sec 14.4: no header = *
	const accepts = parseAcceptLanguage(accept === undefined ? "*" : accept || "")

	if (!provided) {
		return accepts
			.filter(hasQuality)
			.sort(compareSpecs)
			.map((spec) => spec.full) as T[]
	}

	const priorities = provided.map((type, index) => getLanguagePriority(type, accepts, index))

	// sorted list of accepted languages
	return priorities
		.filter(hasQuality)
		.sort(comparePriorities)
		.map((priority) => provided[priorities.indexOf(priority)])
}

function compareSpecs(a: LanguageSpec, b: LanguageSpec) {
	return b.quality - a.quality || a.index - b.index || 0
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

/**
 * Check if a spec has any quality.
 */
const hasQuality = (spec: LanguageSpec | LanguagePriority) => spec.quality > 0

export { preferredLanguages }
