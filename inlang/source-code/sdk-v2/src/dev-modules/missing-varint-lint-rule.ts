import type { MessageBundleLintRule } from "../types/lint.js"

const duplicateVariantLintRule: MessageBundleLintRule = {
	id: "messageBundleLintRule.inlangdev.duplicateVariant",
	displayName: "Duplicate Variant",
	description: "Detects if a variant is present multiple times",
	run: ({ messageBundle, report, settings }) => {
		for (const message of messageBundle.messages) {
			for (const variant of message.variants) {
				const match = variant.match
			}
		}
	},
}

export default duplicateVariantLintRule
