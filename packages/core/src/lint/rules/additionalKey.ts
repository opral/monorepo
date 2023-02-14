import type { Context } from '../context.js'
import { createRule } from '../rule.js'

export const additionalKeyRule = createRule('inlang.additionalKey', 'warn', () => {
	let context: Context
	let referenceLanguage: string

	return {
		initialize: (args) => {
			context = args.context
			referenceLanguage = args.referenceLanguage
		},
		visitors: {
			Resource: ({ target }) => {
				if (target && target.languageTag.name === referenceLanguage) return 'skip'
			},
			Message: ({ target, reference }) => {
				if (!reference && target) {
					context.report({
						node: target,
						message: `Message with id '${target.id.name}' is specified, but missing in the reference`
					})
				}
			},
		},
	}
})