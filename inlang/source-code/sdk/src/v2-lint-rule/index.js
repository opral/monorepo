/**
 * @type {import("../v2/types/lint.js").MessageBundleLintRule}
 */
const lintRule = {
	id: "messageBundleLintRule.inlangdev.missingLanguages",
	displayName: "Missing Languages",
	description: "Detects missing languages",
	run: ({ settings, report, messageBundle }) => {
		const expectedLanguageTags = new Set(settings.locales)
		const presentLanguages = new Set(messageBundle.messages.map((msg) => msg.locale))

		const missingLanguageTags = exclude(expectedLanguageTags, presentLanguages)
		for (const missingLanguageTag of missingLanguageTags) {
			report({
				locale: missingLanguageTag,
				body: `Missing language tag '${missingLanguageTag}'.`,
				messageId: "", // TODO SDK2 fix type to allow undefined
				variantId: "",
				messageBundleId: messageBundle.id,
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
		if (exclude.has(value)) {
			newSet.delete(value)
		}
	}
	return newSet
}

export default lintRule
