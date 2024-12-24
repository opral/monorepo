// Vendored in from https://github.com/jshttp/negotiator
// Rewritten in Typescript & annotated by Loris Sigrist

type LanguageSpec = {
	/**
	 * The index of the language in the Accept-Language header
	 */
	index: number;

	/**
	 * The quality of the language as specified in the Accept-Language header.
	 * Between 0 and 1
	 * @default 1
	 */
	quality: number;

	/**
	 * The language's prefix
	 * @example For "en-GB", the prefix is "en"
	 */
	prefix: string;

	/**
	 * If the langauge has a suffix.
	 * @example For "en-GB", the suffix is "GB"
	 */
	suffix?: string;

	/**
	 * The full BCP 47 of the language
	 * @example "en-GB"
	 */
	full: string;
};

/**
 * Information about the priority of a language that's available in the app relative to that
 * of the language in the Accept-Language header
 */
type LanguagePriority<T extends string = string> = {
	/**
	 * The available language tag which is being considered
	 */
	languageTag: T;

	/**
	 * The index of the languageTag among the available languages
	 */
	index: number;

	/**
	 * The quality of the language as specified in the Accept-Language header.
	 * Between 0 and 1
	 *
	 * Some code uses the value -1 here to signal "no match"
	 *
	 * @default 1
	 */
	quality: number;

	/**
	 * The index of the language in the Accept-Language header
	 * that was compared against when calculating the specificity.
	 */
	order: number;

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
	specificity: number;
};

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
	// No accept-language header -> default to * as per RFC 2616 sec 14.4
	accept ||= "*";

	const acceptLanguageSpecs = parseAcceptLanguageHeader(accept);

	// compare each avaibale language to each language in the Accept-Language header
	// and find the one with the highest priority
	const priorities = availableLanguageTags.map((languageTag, index) =>
		getHighestLanguagePriority(languageTag, acceptLanguageSpecs, index)
	);

	// sorted list of accepted languages
	return priorities
		.filter((prio) => prio.quality > 0) //filter out all languages that didn't match any of the headers whatsoever
		.sort(bySpecificity)
		.sort(byQuality)
		.map((priority) => priority.languageTag);
}

function parseAcceptLanguageHeader(acceptLanguage: string): LanguageSpec[] {
	return acceptLanguage
		.split(",")
		.map((dfn) => dfn.trim())
		.map((dfn, index) => parseLanguage(dfn, index))
		.filter((maybeSpec): maybeSpec is LanguageSpec => Boolean(maybeSpec)); //filter out malformed entries
}

/**
 * Parse a single language from the Accept-Language header.
 *
 * @example
 * ```ts
 * parseLanguage("en-GB;q=0.8", 6) //{ prefix: "en", suffix: "GB", full: "en-GB", quality: 0.8, index: 6 }
 * ```
 *
 * @param languageTag The string to parse
 * @param index The index of the language in the Accept-Language header
 */
function parseLanguage(
	languageTag: string,
	index: number
): LanguageSpec | undefined {
	const LANGUAGE_REGEXP = /^\s*([^\s\-;]+)(?:-([^\s;]+))?\s*(?:;(.*))?$/;
	const match = LANGUAGE_REGEXP.exec(languageTag);

	//Bail if the string is malformed
	if (!match) return undefined;

	const [, prefix, suffix, qualityMatch] = match;

	//shoud never happen given that the regex forces it to be there
	if (!prefix) throw new Error(`Invalid language tag: ${languageTag}`);

	const full = suffix ? `${prefix}-${suffix}` : prefix;

	/**
	 * If the language specifies a quality, parse it, otherwise default to 1
	 * as per RFC 2616
	 */
	const quality = parseQuality(qualityMatch ?? "") ?? 1;

	return {
		prefix,
		suffix,
		quality,
		index,
		full,
	};
}

function parseQuality(qualityMatch: string): number | undefined {
	return qualityMatch
		.split(";")
		.map((param) => param.split("="))
		.filter((p): p is ["q", string] => p[0] == "q" && !!p[1]) //filter out everything that's malformed or not a quality
		.map(([, value]) => parseFloat(value))[0]; //parse the quality value & return the first one
}

/**
 * Calculates the LanguagePriority of the availableLanguageTag
 * relative to all acceptableLanguages and returns the greatest one
 */
function getHighestLanguagePriority<T extends string>(
	/**
	 * A language tag that's available in the project
	 */
	languageTag: T,

	/**
	 * The langauges from the Accept-Language header
	 */
	acceptableLanguages: LanguageSpec[],

	/**
	 * The index of the available language among the available languages
	 */
	index: number
): LanguagePriority<T> {
	const priorities = acceptableLanguages
		.map((spec) => calculatePriority(languageTag, spec, index))
		.filter((prio): prio is LanguagePriority<T> => Boolean(prio));

	const highestPriority = priorities.sort(bySpecificity)[0] || {
		languageTag,
		index: 0,
		order: -1,
		quality: 0,
		specificity: 0,
	};

	return highestPriority;
}

/**
 * Calculates the priority of an available language relative to an acceptable language
 * @param languageTag A language that is available in the project
 * @param spec A parsed language from the Accept-Language header
 * @param index The index of the available language
 * @returns The priority of the language
 */
function calculatePriority<T extends string>(
	languageTag: T,
	spec: LanguageSpec,
	index: number
): LanguagePriority<T> | undefined {
	const parsed = parseLanguage(languageTag, 0);
	if (!parsed) return undefined;

	let specificity = 0b000;
	if (spec.full.toLowerCase() === parsed.full.toLowerCase()) {
		specificity = 0b100;
	} else if (spec.prefix.toLowerCase() === parsed.full.toLowerCase()) {
		specificity = 0b010;
	} else if (spec.full.toLowerCase() === parsed.prefix.toLowerCase()) {
		specificity = 0b001;
	}

	// if there is no specificity at all _and_ we're not considering a wildcard
	// then we bail
	if (specificity === 0 && spec.full !== "*") return undefined;

	return {
		languageTag,
		index,
		order: spec.index,
		quality: spec.quality,
		specificity,
	};
}

const byQuality = (a: LanguagePriority, b: LanguagePriority) =>
	b.quality - a.quality;

const bySpecificity = (a: LanguagePriority, b: LanguagePriority) =>
	b.specificity - a.specificity || a.order - b.order || a.index - b.index;
