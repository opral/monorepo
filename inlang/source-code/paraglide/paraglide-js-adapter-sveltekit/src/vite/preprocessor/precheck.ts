import type { TranslationDefinition } from "./index.js"

/**
 * Performs a quick and dirty check to see if the file should be processed.
 * Will have false positives, but no false negatives.
 *
 * @param content - The source code of the .svelte file
 * @param TRANSLATIONS - The translation definitions
 * @returns true/false if the file should be processed
 */
export function shouldApply(content: string, TRANSLATIONS: TranslationDefinition) {
	const includesSpread = content.includes("{...")
	const includesSvelteElement = content.includes("<svelte:element")

	for (const [element_name, attribute_translations] of Object.entries(TRANSLATIONS)) {
		const includesElement = content.includes(element_name)
		const includesAttribute = attribute_translations.some((tr) =>
			content.includes(tr.attribute_name),
		)

		if ((includesSpread || includesAttribute) && (includesElement || includesSvelteElement)) {
			return true
		}
	}

	return false
}
