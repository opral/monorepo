import type { Resource } from "@inlang/core/ast"
import consola, { Consola } from "consola"

/**
 * The logger that is used throughout the CLI.
 *
 * API -> https://www.npmjs.com/package/consola
 *
 * @example
 *   log.success("Success")
 */
export const log = consola as unknown as Consola

/**
 * Counts the number of messages per language.
 *
 * @param resource The resource to count the messages for.
 * @returns A record with the language as key and the number of messages as value.
 *
 */
export const countMessagesPerLanguage = (resource: Resource[]): Record<string, number> => {
	const counts: Record<string, number> = {}

	for (const { languageTag, body } of resource) {
		const language = languageTag.name

		if (!counts[language]) {
			counts[language] = 0
		}

		counts[language] += body.length
	}

	return counts
}
