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
	o: number
	quality: number
	s: number
}

const LANGUAGE_REGEXP = /^\s*([^\s\-;]+)(?:-([^\s;]+))?\s*(?:;(.*))?$/

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
	const match = LANGUAGE_REGEXP.exec(str)
	if (!match) return undefined

	const prefix = match[1]
	const suffix = match[2]
	let full = prefix

	if (suffix) full += "-" + suffix

	let quality = 1
	if (match[3]) {
		const params = match[3].split(";")
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
	let priority: LanguagePriority = { index: 0, o: -1, quality: 0, s: 0 }

	for (const element of accepted) {
		const spec = specify(language, element, index)

		if (
			spec &&
			(priority.s - spec.s || priority.quality - spec.quality || priority.o - spec.o) < 0
		) {
			priority = spec as any
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
	let s = 0
	if (spec.full.toLowerCase() === parsed.full.toLowerCase()) {
		s |= 4
	} else if (spec.prefix.toLowerCase() === parsed.full.toLowerCase()) {
		s |= 2
	} else if (spec.full.toLowerCase() === parsed.prefix.toLowerCase()) {
		s |= 1
	} else if (spec.full !== "*") {
		return undefined
	}

	return {
		index,
		o: spec.index,
		quality: spec.quality,
		s: s,
	}
}

/**
 * Get the preferred languages from an Accept-Language header.
 * @public
 */
function preferredLanguages(accept: string, provided: string[]) {
	// RFC 2616 sec 14.4: no header = *
	const accepts = parseAcceptLanguage(accept === undefined ? "*" : accept || "")

	if (!provided) {
		return accepts.filter(isQuality).sort(compareSpecs).map(getFullLanguage)
	}

	const priorities = provided.map((type, index) => getLanguagePriority(type, accepts, index))

	// sorted list of accepted languages
	return priorities
		.filter(isQuality)
		.sort(comparePriorities)
		.map((priority) => provided[priorities.indexOf(priority)])
}

function compareSpecs(a: LanguageSpec, b: LanguageSpec) {
	return b.quality - a.quality || a.index - b.index || 0
}

function comparePriorities(a: LanguagePriority, b: LanguagePriority) {
	return b.quality - a.quality || b.s - a.s || a.o - b.o || a.index - b.index || 0
}

/**
 * Get full language string.
 */
function getFullLanguage(spec: LanguageSpec) {
	return spec.full
}

/**
 * Check if a spec has any quality.
 */
function isQuality(spec: LanguageSpec | LanguagePriority) {
	return spec.quality > 0
}

export { preferredLanguages }
