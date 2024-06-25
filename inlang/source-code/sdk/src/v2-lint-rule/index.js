/**
 * @type {import("../v2/types/lint.js").MessageBundleLintRule}
 */
const lintRule = {
	id: "messageLintRule.inlang-dev.missing-languages",
	displayName: "Missing Languages",
	description: "Detects missing languages",
	run: ({ settings, report, messageBundle }) => {
		const expectedLanguageTags = new Set(settings.languageTags)
		const presentLanguages = new Set(messageBundle.messages.map((msg) => msg.locale))

		const missingLanguageTags = exclude(expectedLanguageTags, presentLanguages)
		for (const missingLanguageTag of missingLanguageTags) {
			report({
				languageTag: missingLanguageTag,
				body: `Missing language tag '${missingLanguageTag}'.`,
			})
		}
	},
}

/**
 * @template T
 * @param {Set<T>} set
 * @param {Set<T>} exclude
 * @returns {Set<T>}
 */
function exclude(set, exclude) {
	const newSet = new Set(set)
	for (const value of set) {
		if (exclude.has(value)) continue
		newSet.add(value)
	}
	return newSet
}

export default lintRule
