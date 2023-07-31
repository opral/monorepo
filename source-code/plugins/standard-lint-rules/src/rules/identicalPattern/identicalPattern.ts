import type { Variant } from "@inlang/messages"
import type { MessageLintRule } from "@inlang/plugin"

type IdenticalPatternRuleOptions = {
	ignore: string[]
}

export const identicalPatternRule = ({
	ignore = [],
}: IdenticalPatternRuleOptions): MessageLintRule => ({
	meta: {
		id: "inlang.identicalPattern",
		displayName: {
			en: "Identical Pattern",
		},
		description: {
			en: `
Checks for identical patterns in different languages.

A message with identical wording in multiple languages can indicate
that the translations are redundant or can be combined into a single
message to reduce translation effort.
`,
		},
		defaultLevel: "warning",
	},
	message: ({ message: { id, body }, config, report }) => {
		const referenceVariants = body[config.sourceLanguageTag]!

		const languageTags = Object.keys(body)
		for (const languageTag of languageTags) {
			const isMessageIdentical =
				messageBodyToString(referenceVariants) === messageBodyToString(body[languageTag]!)
			const shouldBeIgnored = (referenceVariants || []).some((variant) =>
				ignore.includes(patternToString(variant.pattern)),
			)
			if (isMessageIdentical && !shouldBeIgnored) {
				report({
					messageId: id,
					languageTag,
					body: {
						en: `Identical content found in language '${languageTag}' with message ID '${id}'.`,
					},
				})
			}
		}
	},
})

// TODO: use a generic toString function instead of JSON.stringify
const messageBodyToString = (body: Variant[]) => JSON.stringify(body)

// TODO: use a generic toString function instead of this custom code
const patternToString = (pattern: Variant["pattern"]) => JSON.stringify(pattern)
