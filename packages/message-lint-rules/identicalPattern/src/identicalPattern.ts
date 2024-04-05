import type { Text, Variant } from "@inlang/message"
import type { MessageLintRule } from "@inlang/message-lint-rule"
import { id, displayName, description } from "../marketplace-manifest.json"

import { Type, type Static } from "@sinclair/typebox"

type RuleSettings = Static<typeof RuleSettings>
const RuleSettings = Type.Object({
	ignore: Type.Optional(
		Type.Array(
			Type.String({
				pattern: "[^*]",
				description: "All items in the array need quotaion marks at the end and beginning",
			}),
			{
				title: "DEPRICATED. Ignore paths",
				description: "Set a path that should be ignored.",
			}
		)
	),
})

export const identicalPatternRule: MessageLintRule = {
	id: id as MessageLintRule["id"],
	displayName,
	description,
	settingsSchema: RuleSettings,
	run: ({ message, report, settings }) => {
		const ruleSettings = settings[id as keyof typeof settings] as RuleSettings | undefined

		const referenceVariant = message.variants.find(
			(variant) => variant.languageTag === settings.sourceLanguageTag
		)
		if (referenceVariant === undefined) return

		const translatedVariants = message.variants.filter(
			(variant) => variant.languageTag !== settings.sourceLanguageTag
		)

		for (const variant of translatedVariants) {
			const isMessageIdentical =
				messageVariantToString(referenceVariant) === messageVariantToString(variant)
			const shouldBeIgnored = ruleSettings?.ignore?.includes(
				patternToString(referenceVariant.pattern)
			)

			if (isMessageIdentical && !shouldBeIgnored) {
				report({
					messageId: message.id,
					languageTag: variant.languageTag,
					body: {
						en: `Identical content found in language '${variant.languageTag}' with message ID '${message.id}'.`,
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
