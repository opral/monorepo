import type { MessageLintRule } from "@inlang/lint"

export const messageWithoutSourceRule: MessageLintRule = {
	type: "MessageLint",
	meta: {
		id: "inlang.lintRule.messageWithoutSource",
		displayName: {
			en: "Message Without Source",
		},
		description: {
			en: `
Checks for likely outdated messages.

A message with a missing source is usually an indication that
the message (id) is no longer used in source code, but messages
have not been updated accordingly.
`,
		},
		marketplace: {
			icon: "https://raw.githubusercontent.com/inlang/inlang/main/source-code/plugins/standard-lint-rules/assets/icon.png",
			linkToReadme: {
				en: "https://github.com/inlang/inlang/blob/main/source-code/plugins/standard-lint-rules/README.md",
			},
			keywords: ["lint-rule", "standard", "message-without-source"],
			publisherName: "inlang",
			publisherIcon: "https://inlang.com/favicon/safari-pinned-tab.svg",
		},
	},
	message: ({ message: { id, variants }, sourceLanguageTag, report }) => {
		if (!variants.some((variant) => variant.languageTag === sourceLanguageTag)) {
			report({
				messageId: id,
				languageTag: sourceLanguageTag,
				body: {
					en: `Message with id '${id}' is specified, but missing in the source.`,
				},
			})
		}
	},
}
