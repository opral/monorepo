import type { Language } from "./sharedTypes.js"

export const matchLang = (detected: Language[], availableLanguages: Set<Language>) => {
	// The found related langs including their index from availableLanguages
	for (const d of detected) {
		const relatedLangs: string[] = []
		for (const aL of availableLanguages) {
			// Immediately return perfect match
			if (aL === d) return aL
			// There can be multiple related langs in availableLanguages.
			else if (aL.startsWith(d + "-") || d.startsWith(aL + "-")) relatedLangs.push(aL)
		}
		// Unspecific related langs should be preferred, otherwise we sort alphabetically
		relatedLangs.sort().sort((a, b) => a.split("-").length - b.split("-").length)
		if (relatedLangs.length > 0) return relatedLangs[0]
	}
}
