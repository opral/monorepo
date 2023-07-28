import type { LanguageTag } from "@inlang/language-tag"
import type { Message, Variant } from "./api.js"
import type { Result } from "@inlang/result"

/**
 * Get the variant of a message
 *
 * All actions are immutable.
 *
 * @example
 * 	const variant = getVariant(message, { languageTag: "en", selectors: { gender: "male" }});
 */
export function getVariant(
	message: Message,
	options: {
		languageTag: LanguageTag
		selectors: Record<string, string>
	},
): Result<
	Variant["pattern"],
	VariantDoesNotExistException | PatternsForLanguageTagDoNotExistException
> {
	if (!message.body[options.languageTag])
		return { error: new PatternsForLanguageTagDoNotExistException(message.id, options.languageTag) }
	const variant = matchMostSpecificVariant(message, options.languageTag, options.selectors)
	if (variant) {
		//! do not return a reference to the message in a resource
		//! modifications to the returned message will leak into the
		//! resource which is considered to be unmutable.
		return { data: JSON.parse(JSON.stringify(variant.pattern)) }
	}
	return { error: new VariantDoesNotExistException(message.id, options.languageTag) }
}

/**
 * Create a variant for a message
 *
 * All actions are immutable.
 *
 * @example
 *  const message = createVariant(message, { languageTag: "en", data: variant })
 */
export function createVariant(
	message: Message,
	options: {
		languageTag: LanguageTag
		data: Variant
	},
): Result<Message, VariantAlreadyExistsException | PatternsForLanguageTagDoNotExistException> {
	const copy: Message = JSON.parse(JSON.stringify(message))
	if (getVariant(copy, { languageTag: options.languageTag, selectors: options.data.match })) {
		return { error: new VariantAlreadyExistsException(message.id, options.languageTag) }
	}
	if (copy.body[options.languageTag] === undefined) {
		return { error: new PatternsForLanguageTagDoNotExistException(message.id, options.languageTag) }
	}
	copy.body[options.languageTag]!.push(options.data)
	return { data: copy }
}

/**
 * Update a variant of a message
 *
 * All actions are immutable.
 *
 * @example
 *  const message = updateVariant(message, { languageTag: "en", selectors: { gender: "male" }, pattern: []})
 */
export function updateVariant(
	message: Message,
	options: {
		languageTag: LanguageTag
		selectors: Record<string, string>
		pattern: Variant["pattern"]
	},
): Result<Message, VariantDoesNotExistException | PatternsForLanguageTagDoNotExistException> {
	const copy: Message = JSON.parse(JSON.stringify(message))
	if (copy.body[options.languageTag] === undefined) {
		return { error: new PatternsForLanguageTagDoNotExistException(message.id, options.languageTag) }
	}
	const variant = matchMostSpecificVariant(copy, options.languageTag, options.selectors)
	if (variant) {
		variant.pattern = options.pattern
		return { data: copy }
	}
	return { error: new VariantDoesNotExistException(message.id, options.languageTag) }
}

/**
 * Returns the most specific variant of a message.
 *
 * @example
 *  const variant = matchMostSpecificVariant(message, languageTag: "en", selectors: { gender: "male" })
 */
const matchMostSpecificVariant = (
	message: Message,
	languageTag: LanguageTag,
	preferenceSelectors: Record<string, string>,
): Variant | undefined => {
	// get all selectors of message
	const messageSelectors = message.selectors

	// resolve preferenceSelectors to match length and order of message selectors, but values in an Array to be comparable, example: ["male", "1"]
	const resolvedPreferences: string[] = []
	messageSelectors.forEach((messageSelector, index) => {
		resolvedPreferences[index] = preferenceSelectors[messageSelector] ?? "*"
	})

	let matchedVariant: Variant | undefined
	// go through the selectors to determine the precedence of patterns
	// -> if there is no match, turn first selector to '*', still no match, turn second selector to '*'
	for (let i = 0; i <= messageSelectors.length; i++) {
		// find the exact match
		const match: Variant | undefined = message.body[languageTag]!.find((variant) => {
			return JSON.stringify(resolvedPreferences) === JSON.stringify(Object.values(variant.match))
				? true
				: false
		})
		if (!match) {
			// if no variants matched, try again with less specific selectors
			if (Object.keys(resolvedPreferences)[i]) {
				resolvedPreferences[i] = "*"
			}
		} else {
			matchedVariant = match
		}
	}

	if (matchedVariant) {
		return matchedVariant
	} else {
		return undefined
	}
}

class VariantDoesNotExistException extends Error {
	readonly #id = "VariantDoesNotExistException"

	constructor(messageId: string, languageTag: string) {
		super(
			`For message '${messageId}' and '${languageTag}', there doesn't exist a variant for this specific matchers.`,
		)
	}
}
class VariantAlreadyExistsException extends Error {
	readonly #id = "VariantAlreadyExistsException"

	constructor(messageId: string, languageTag: string) {
		super(
			`For message '${messageId}' and '${languageTag}', there already exists a variant for this specific matchers.`,
		)
	}
}
class PatternsForLanguageTagDoNotExistException extends Error {
	readonly #id = "PatternsForLanguageTagDoNotExistException"

	constructor(messageId: string, languageTag: string) {
		super(`For message '${messageId}' there are no patterns with the languageTag '${languageTag}'.`)
	}
}
