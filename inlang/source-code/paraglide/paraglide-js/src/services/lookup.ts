type LookupOptions = {
	locales: string[]
	baseLocale: string
}

/**
 * Performs a lookup for the given language tag, among the available language tags,
 * according to the IETF BCP 47 spec.
 *
 * It **does not support Wildcards** at the moment.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc4647#section-3.4
 */
export function lookup(locale: string, options: LookupOptions): string {
	const fallbackLanguages: string[] = []

	const languageTagParts = locale.split("-").filter(Boolean)
	for (let i = languageTagParts.length; i > 0; i--) {
		//Skip the x separator
		if (languageTagParts[i - 1] === "x") continue

		//Stringify the language tag parts
		const fallbackLanguageTag = languageTagParts.slice(0, i).join("-")
		if (!options.locales.includes(fallbackLanguageTag)) continue
		fallbackLanguages.push(fallbackLanguageTag)
	}

	return fallbackLanguages[0] ?? options.baseLocale
}
