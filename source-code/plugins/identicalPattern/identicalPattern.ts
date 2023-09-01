import type { Text, Variant } from "@inlang/message"
import type { MessageLintRule } from "@inlang/lint-rule"

type Settings = {
	ignore?: string[]
}

export const identicalPatternRule: MessageLintRule<Settings> = {
	type: "MessageLint",
	meta: {
		id: "inlang.lintRule.identicalPattern",
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
	},
	message: ({ message: { id, variants }, sourceLanguageTag, report, settings }) => {
		const referenceVariant = variants.find((variant) => variant.languageTag === sourceLanguageTag)
		if (referenceVariant === undefined) return

		const translatedVariants = variants.filter(
			(variant) => variant.languageTag !== sourceLanguageTag,
		)

		for (const variant of translatedVariants) {
			const isMessageIdentical =
				messageVariantToString(referenceVariant) === messageVariantToString(variant)
			const shouldBeIgnored = settings.ignore?.includes(patternToString(referenceVariant.pattern))

			if (isMessageIdentical && !shouldBeIgnored) {
				report({
					messageId: id,
					languageTag: variant.languageTag,
					body: {
						en: `Identical content found in language '${variant.languageTag}' with message ID '${id}'.`,
					},
				})
			}
		}
	},
}

// TODO: use a generic toString function instead of JSON.stringify
const messageVariantToString = (variant: Variant) => {
	const variantWithoutLanguageTag = { ...variant, languageTag: undefined }
	return JSON.stringify(variantWithoutLanguageTag)
}

// TODO: use a generic toString function instead of this custom code
const patternToString = (pattern: Variant["pattern"]) =>
	pattern
		.filter((pattern): pattern is Text => pattern.type === "Text")
		.map((part) => part.value)
		.join("")
