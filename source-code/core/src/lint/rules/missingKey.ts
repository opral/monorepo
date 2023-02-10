import type { Context } from '../context.js'
import { createRule } from '../rule.js'

export const missingKeyRule = createRule('inlang.missingKey', () => {
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
				if (!target && reference) {
					context.report(reference, `Message with id '${reference.id.name}' missing`)
				}
			}
		},
	}
})