// import { createVariant } from "../helper.js"
import type { MessageBundleLintRule } from "../types/lint.js"

const missingCatchallLintRule: MessageBundleLintRule = {
	id: "messageBundleLintRule.inlang.missingCatchall",
	displayName: "Missing catchall",
	description: "Warns if a message is missing a catchall variant",
	run: ({ report, messageBundle }) => {
		for (const message of messageBundle.messages) {
			if (message.selectors.length === 0) continue

			const hasCatchall = message.variants.some((variant) =>
				Object.values(variant.match)?.every((m) => m === "*")
			)

			if (!hasCatchall) {
				report({
					body: `The message ${message.id} is missing a catchall variant`,
					target: {
						bundleId: messageBundle.id,
						messageId: message.id,
						variantId: undefined,
					},
					// locale: message.locale,
					fixes: [
						{
							key: "yadayada",
							title: "Add catchall variant",
						},
					],
				})
			}
		}
	},
	fix: ({ report, messageBundle }) => {
		const message = messageBundle.messages.find((msg) => msg.id === report.target.messageId)
		if (!message)
			throw new Error(`message ${report.target.messageId} not found on bundle ${messageBundle.id}`)

		// TODO SDK-v2 LINT
		// const catchallVariant = createVariant({
		// 	text: "",
		// 	match: message.selectors.map(() => "*"),
		// })

		// message.variants.push(catchallVariant)
		return messageBundle
	},
}
export default missingCatchallLintRule
