import type * as ast from "@inlang/core/ast"
import { query } from "@inlang/core/query"

/**
 * Get the percentage of translated messages.
 *
 */
export function missingTranslations(args: {
	resources: ast.Resource[]
	referenceResource: ast.Resource
}): {
	percentage: number
	numberOfMissingTranslations: number
} {
	const resourcesToTranslateTo = args.resources.filter(
		(resource) => resource.languageTag.name !== args.referenceResource.languageTag.name,
	)

	let numberOfMissingTranslations = 0

	for (const message of args.referenceResource.body) {
		for (const resource of resourcesToTranslateTo) {
			if (query(resource).get({ id: message.id.name }) === undefined) {
				numberOfMissingTranslations += 1
			}
		}
	}

	const totalNumberOfReferenceMessages = query(args.referenceResource).includedMessageIds().length

	if (numberOfMissingTranslations === 0) {
		return { percentage: 100, numberOfMissingTranslations }
	}

	return {
		// math 1x1 :(
		percentage:
			100 -
			// takes the inverse
			Math.round(
				(numberOfMissingTranslations /
					(totalNumberOfReferenceMessages * resourcesToTranslateTo.length)) *
					100,
			),
		numberOfMissingTranslations,
	}
}
