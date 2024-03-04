/**
 * Vendored in from https://github.com/jshttp/negotiator
 */

type LanguageSpec = {
	i: number
	q: number
	full: string
	prefix: string
	suffix: string
}

type LanguagePriority = {
	i: number
	o: number
	q: number
	s: number
}

const LANGUAGE_REGEXP = /^\s*([^\s\-;]+)(?:-([^\s;]+))?\s*(?:;(.*))?$/

/**
 * Parse the Accept-Language header.
 */
function parseAcceptLanguage(accept: string): LanguageSpec[] {
	const accepts = accept.split(",")
	const languageSpec: LanguageSpec[] = []

	for (const [i, accept_] of accepts.entries()) {
		const language = parseLanguage(accept_.trim(), i)
		if (language) {
			languageSpec.push(language)
		}
	}

	return languageSpec
}

/**
 * Parse a language from the Accept-Language header.
 */
function parseLanguage(str: string, i: number): LanguageSpec | undefined {
	const match = LANGUAGE_REGEXP.exec(str)
	if (!match) return undefined

	const prefix = match[1]
	const suffix = match[2]
	let full = prefix

	if (suffix) full += "-" + suffix

	let q = 1
	if (match[3]) {
		const params = match[3].split(";")
		for (const param of params) {
			const p = param.split("=")
			if (p[0] === "q") q = parseFloat(p[1])
		}
	}

	return {
		prefix: prefix,
		suffix: suffix,
		q: q,
		i: i,
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
	let priority = { i: 0, o: -1, q: 0, s: 0 }

	for (const element of accepted) {
		const spec = specify(language, element, index)

		if (spec && (priority.s - spec.s || priority.q - spec.q || priority.o - spec.o) < 0) {
			priority = spec
		}
	}

	return priority
}

/**
 * Get the specificity of the language.
 */
function specify(language: string, spec: LanguageSpec, index: number) {
	const p = parseLanguage(language, 0)
	if (!p) return undefined
	let s = 0
	if (spec.full.toLowerCase() === p.full.toLowerCase()) {
		s |= 4
	} else if (spec.prefix.toLowerCase() === p.full.toLowerCase()) {
		s |= 2
	} else if (spec.full.toLowerCase() === p.prefix.toLowerCase()) {
		s |= 1
	} else if (spec.full !== "*") {
		return undefined
	}

	return {
		i: index,
		o: spec.i,
		q: spec.q,
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
	return b.q - a.q || a.i - b.i || 0
}

function comparePriorities(a: LanguagePriority, b: LanguagePriority) {
	return b.q - a.q || b.s - a.s || a.o - b.o || a.i - b.i || 0
}

/**
 * Get full language string.
 * @private
 */
function getFullLanguage(spec: LanguageSpec) {
	return spec.full
}

/**
 * Check if a spec has any quality.
 * @private
 */
function isQuality(spec: LanguageSpec | LanguagePriority) {
	return spec.q > 0
}

export { preferredLanguages }
