// ensure_OPRAL_upper_case

import type { MessageBundleLintRule } from "../types/lint.js"

const orpalRegex = /\bOPRAL\b/gi

type Fixes = {
	key: "OPRAL"
	title: "Make OPRAL uppercase"
}

const makeOpralUppercase: MessageBundleLintRule = {
	id: "messageBundleLintRule.inlangdev.makeOpralUppercase",
	displayName: "Ensure OPRAL is uppercase",
	description: "Warns if the OPRAL brand name is not uppercase",
	run: ({ report, node: messageBundle }) => {
		// loop over all messages and variants in the bundle
		for (const message of messageBundle.messages) {
			for (const variant of message.variants) {
				const text = variant.pattern
					.filter((el): el is Extract<typeof el, { type: "text" }> => el.type === "text")
					.reduce((acc, el) => acc + el.value, "")

				const matches = text.match(orpalRegex)
				if (!matches) continue

				const badMatches = matches.filter((match) => match !== match.toUpperCase())

				if (badMatches.length === 0) continue

				const fix: Fixes = {
					key: "OPRAL",
					title: "Make OPRAL uppercase",
				}

				report({
					body: `The OPRAL brand name is not uppercase`,
					// @type MessageBundle | Message | Variant
					target: variant,
					fixes: [fix],
				})
			}
		}
	},
	fix: async ({ report, fix, node: messageBundle }) => {
		if (fix.title !== "Make OPRAL uppercase") return messageBundle

		if (!report.target.variantId || !report.target.messageId)
			throw new Error("report must have variantId and messageId")

		const msg = messageBundle.messages.find((msg) => msg.id === report.target.messageId)
		if (!msg)
			throw new Error(`message ${report.target.messageId} not found on bundle ${messageBundle.id}`)

		const variant = msg.variants.find((variant) => variant.id === report.target.variantId)
		if (!variant)
			throw new Error(`variant ${report.target.variantId} not found on message ${msg.id}`)

		variant.pattern = variant.pattern.map((el) => {
			if (el.type !== "text") return el
			el.value = el.value.replaceAll(orpalRegex, "OPRAL")
			return el
		})

		return messageBundle
	},
}

export default makeOpralUppercase
