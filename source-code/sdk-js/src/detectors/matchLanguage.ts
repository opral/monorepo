import type { Language } from "@inlang/core/ast"
import type { Detector } from "./types.js"

/**
 * A function that takes one or more detected languages and matches them with the specified available languages.
 * Depending on the passed allowRelated parameter also related languages ("en" and "en-GB") are considered a match.
 * Related matches are only considered if no perfect matches can be found.
 * @param detected The detected languages available for matching. Either an array of strings, a single string or undefined
 * @param availableLanguages A set of available languages (strings) for matching. Insertion order is irrelevant
 * @param allowRelated A boolean specifying whether related languages ("en" and "en-US") can be considered if no perfect match can be found in availableLanguages and detected
 * @returns Return string in case of a successful match or otherwise undefined
 */

export const matchLanguage = (
	detected: ReturnType<Detector>,
	availableLanguages: Array<Language>,
	allowRelated = false,
) => {
	// The found related langs including their index from availableLanguages
	if (detected === undefined) return
	for (const d of typeof detected === "string" ? [detected] : detected) {
		const relatedLangs: string[] = []
		for (const aL of availableLanguages) {
			// Immediately return perfect match
			if (aL === d) return aL
			// There can be multiple related langs in availableLanguages.
			else if (allowRelated && (aL.startsWith(d + "-") || d.startsWith(aL + "-")))
				relatedLangs.push(aL)
		}
		if (allowRelated) {
			// Unspecific related langs should be preferred, otherwise we sort alphabetically
			relatedLangs.sort().sort((a, b) => a.split("-").length - b.split("-").length)
			if (relatedLangs.length > 0) return relatedLangs[0]
		}
	}
}
