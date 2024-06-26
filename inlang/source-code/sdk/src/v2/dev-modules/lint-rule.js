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
				locale: "",
				body: `No languages are present`,
				messageId: undefined,
				variantId: undefined,
				messageBundleId: messageBundle.id,
				fixes: [],
			})
			return
		}

		const missingLanguageTags = exclude(expectedLanguageTags, presentLanguages)
		for (const missingLanguageTag of missingLanguageTags) {
			report({
				locale: missingLanguageTag,
				body: `Missing language tag '${missingLanguageTag}'.`,
				messageId: undefined,
				variantId: undefined,
				messageBundleId: messageBundle.id,
				fixes: [],
			})
		}
	},
	fix: async ({ customApi, report, messageBundle }) => {
		// run translator for language report.locale
		console.log("lint-rule: customApi", customApi)
		return messageBundle
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
