import type { Context } from '../context.js'
import { createRule } from '../rule.js'

export const additionalKeyRule = createRule('inlang.additionalKey', () => {
	let context: Context
	let referenceLanguage: string

	return {
		initialize: (config) => {
			context = config.context
			referenceLanguage = config.referenceLanguage
		},
		visitors: {
			Resource: ({ target }) => {
				if (target && target.languageTag.name === referenceLanguage) return 'skip'
			},
			Message: ({ target, reference }) => {
				if (!reference && target) {
					context.report(target, `Message with id '${target.id.name}' is specified, mut missing in the reference`)
				}
			},
		},
	}
})