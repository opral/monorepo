/**
 * @type {import("../types/lint.js").MessageBundleLintRule}
 */
const lintRule = {
	id: "messageBundleLintRule.inlangdev.missingLanguages",
	displayName: "Missing Languages",
	description: "Detects missing languages",
	run: ({ settings, report, messageBundle }) => {
		const expectedLanguageTags = new Set(settings.locales)
		const presentLanguages = new Set(
			messageBundle.messages.filter((msg) => msg.variants.length > 0).map((msg) => msg.locale)
		)

		if (presentLanguages.size === 0) {
			// no messages in any language -> delete
			report({
				body: `No languages are present`,
				target: {
					messageId: undefined,
					variantId: undefined,
					bundleId: messageBundle.id,
				},
				fixes: [],
			})
			return
		}

		const missingLanguageTags = exclude(expectedLanguageTags, presentLanguages)
		for (const missingLanguageTag of missingLanguageTags) {
			report({
				// locale: missingLanguageTag,
				body: `Missing language tag '${missingLanguageTag}'.`,
				target: {
					messageId: undefined,
					variantId: undefined,
					bundleId: messageBundle.id,
				},
				fixes: [],
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
