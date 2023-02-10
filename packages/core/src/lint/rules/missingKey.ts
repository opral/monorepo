import type { Reporter } from '../reporter.js'
import { createRule } from '../rule.js'

export const missingKeyRule = createRule('inlang.missingKey', () => {
	let reporter: Reporter
	let referenceLanguage: string

	return {
		initialize: (config) => {
			reporter = config.reporter
			referenceLanguage = config.referenceLanguage
		},
		visitors: {
			Resource: ({ target }) => {
				if (target && target.languageTag.name === referenceLanguage) return 'skip'
			},
			Message: ({ target, reference }) => {
				if (!target && reference) {
					reporter.report(reference, `Message with id '${reference.id.name}' missing`)
				}
			}
		},
	}
})