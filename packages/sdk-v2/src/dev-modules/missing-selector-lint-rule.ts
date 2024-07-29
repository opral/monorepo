import type { MessageBundleLintRule } from "../types/lint.js"
// TODO SDK-v2 LINT
// import type { VariableReference } from "../types/message-bundle.js"
type VariableReference = any

const missingSelectorLintRule: MessageBundleLintRule = {
	id: "messageBundleLintRule.inlangdev.missingSelector",
	displayName: "Missing Selector",
	description: "Detects if a selector is not used in a language",

	run: ({ report, messageBundle, settings }) => {
		const sourceMessage = messageBundle.messages.find(
			(message) => message.locale === settings.baseLocale
		)
		if (!sourceMessage) return

		const expectedSelectors = new Set(
			sourceMessage.selectors
				.filter((selector: any) => selector.arg.type === "variable")
				.map((selector: any) => (selector.arg as VariableReference).name)
		)

		for (const message of messageBundle.messages) {
			if (message.locale === settings.baseLocale) continue // ignore the base locale

			const selectors = new Set(
				message.selectors
					.filter((selector: any) => selector.arg.type === "variable")
					.map((selector: any) => (selector.arg as VariableReference).name)
			)

			const missing = exclude(expectedSelectors, selectors)
			if (missing.size === 0) continue

			report({
				// locale: message.locale,
				body: `Missing selector(s): ${[...missing].join(", ")}`,
				target: {
					messageId: undefined,
					variantId: undefined,
					bundleId: messageBundle.id,
				},
				fixes: [],
			})

			// if there are missing selectors - report them
		}
	},
}

function exclude<T>(set: Set<T>, exclude: Set<T>): Set<T> {
	const newSet = new Set<T>(set)
	for (const value of newSet) {
		if (exclude.has(value)) newSet.delete(value)
	}
	return newSet
}

export default missingSelectorLintRule
