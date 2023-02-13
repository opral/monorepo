import type { Context } from '../context.js'
import { createRule } from '../rule.js'

export const createBrandingRule = (brandName: string, incorrectBrandingNames: string[]) => createRule('inlang.brandingRule', () => {
	let context: Context

	return {
		initialize: (args) => {
			context = args.context
		},
		visitors: {
			Pattern: ({ target }) => {
				if (!target) return

				const incorrectlyBrandedWords = target.elements
					.flatMap(element => incorrectBrandingNames.filter(word => element.value.includes(word)))

				for (const incorrectlyBrandedElement of incorrectlyBrandedWords) {
					context.report({
						node: target,
						message: `Element '${incorrectlyBrandedElement}' is incorrectly branded and should be replaced with '${brandName}'`
					})
				}
			}
		},
	}
})
