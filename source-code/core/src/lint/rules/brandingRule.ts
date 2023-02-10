import type { Reporter } from '../reporter.js'
import { createRule } from '../rule.js'

export const createBrandingRule = (brandName: string, incorrectBrandingNames: string[]) => createRule('inlang.brandingRule', () => {
	let reporter: Reporter

	return {
		initialize: (config) => {
			reporter = config.reporter
		},
		visitors: {
			Pattern: ({ target }) => {
				if (!target) return

				const incorrectlyBrandedWords = target.elements
					.flatMap(element => incorrectBrandingNames.filter(word => element.value.includes(word)))

				for (const incorrectlyBrandedElement of incorrectlyBrandedWords) {
					reporter.report(target, `Element '${incorrectlyBrandedElement}' is incorrectly branded and should be replaced with '${brandName}'`)
				}
			}
		},
	}
})
