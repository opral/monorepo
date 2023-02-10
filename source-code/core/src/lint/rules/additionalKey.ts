import type { Reporter } from '../reporter.js'
import { createRule } from '../rule.js'

export const additionalKeyRule = createRule('inlang.additionalKey', () => {
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
				if (!reference && target) {
					reporter.report(target, `Message with id '${target.id.name}' is specified, mut missing in the reference`)
				}
			},
		},
	}
})