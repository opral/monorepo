import type { MessageLintRule } from "@inlang/lint-api"
import type { Variant } from '@inlang/messages'

type IdenticalPatternRuleOptions = {
	ignore: string[]
}

/**
 * Checks for identical patterns in different languages.
 *
 * A message with identical wording in multiple languages can indicate
 * that the translations are redundant or can be combined into a single
 * message to reduce translation effort.
 */
export const identicalPattern = ({ ignore = [] }: IdenticalPatternRuleOptions) => ({
	id: "inlang.identicalPattern",
	displayName: {
		en: 'Identical Pattern'
	},
	defaultLevel: 'warn', // TODO: how to override level?
	message: ({ message: { id, body }, config, report }) => {
		const referenceVariants = body[config.sourceLanguageTag]!

		const languageTags = Object.keys(body)
		for (const languageTag of languageTags) {
			const isMessageIdentical = messageBodyToString(referenceVariants) === messageBodyToString(body[languageTag]!)
			const shouldBeIgnored = (referenceVariants || [])
				.some(variant => ignore.includes(patternToString(variant.pattern)))
			if (isMessageIdentical && !shouldBeIgnored) {
				report({
					messageId: id,
					languageTag,
					body: {
						en: `Identical content found in language '${languageTag}' with message ID '${id}'.`,
					}
				})
			}
		}
	},
}) satisfies MessageLintRule

// TODO: use a generic toString function instead of JSON.stringify
const messageBodyToString = (body: Variant[]) => JSON.stringify(body)

// TODO: use a generic toString function instead of this custom code
const patternToString = (pattern: Variant['pattern']) => JSON.stringify(pattern)
