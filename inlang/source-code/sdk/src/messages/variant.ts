import type { LanguageTag, Message, Translation, Variant } from "../versionedInterfaces.js"
import type { Result } from "@inlang/result"
import {
	MessagePatternsForLanguageTagDoNotExistError,
	MessageVariantAlreadyExistsError,
	MessageVariantDoesNotExistError,
} from "./errors.js"

/**
 * Tries to match the most specific variant of a message.
 *
 * The selectors determine the specificity of a variant. If no selectors are provided,
 * or if the selectors do not match any variant, the catch all variant is returned
 * (if it exists).
 *
 * @example
 * 	const variant = getVariant(message, { where: { languageTag: "en", match: ["male"]}});
 */
export function getVariant(
	message: Message,
	args: {
		where: {
			languageTag: LanguageTag
			match?: Variant["match"]
		}
	}
): Variant | undefined {
	const variant = matchMostSpecificVariant(message, args.where.languageTag, args.where.match)
	if (variant) {
		//! do not return a reference to the message in a resource
		//! modifications to the returned message will leak into the
		//! resource which is considered to be immutable.
		return structuredClone(variant)
	}
	return undefined
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
	args: {
		languageTag: LanguageTag
		data: Variant
	}
): Result<Message, MessageVariantAlreadyExistsError> {
	const copy = structuredClone(message)

	//find the translation
	let translation = copy.translations.find((trans) => trans.languageTag === args.languageTag)

	if (!translation) {
		const newTranslation: Translation = {
			languageTag: args.languageTag,
			selectors: [],
			declarations: [],
			variants: [],
		}

		copy.translations.push(newTranslation)
		translation = newTranslation
	}

	// check if variant already exists
	if (matchVariant(copy, args.languageTag, args.data.match)) {
		return { error: new MessageVariantAlreadyExistsError(message.id, args.languageTag) }
	}

	translation.variants.push({
		...args.data,
		match: args.data.match,
	})
	return { data: copy }
}

/**
 * Update a variant of a message
 *
 * All actions are immutable.
 *
 * @example
 *  const message = updateVariant(message, { languageTag: "en", match: ["male"], pattern: []})
 */
export function updateVariantPattern(
	message: Message,
	args: {
		where: {
			languageTag: LanguageTag
			match: Variant["match"]
		}
		data: Variant["pattern"]
	}
): Result<Message, MessageVariantDoesNotExistError | MessagePatternsForLanguageTagDoNotExistError> {
	const copy = structuredClone(message)

	//find the translation
	const translation = copy.translations.find(
		(trans) => trans.languageTag === args.where.languageTag
	)

	if (!translation) {
		return {
			error: new MessagePatternsForLanguageTagDoNotExistError(message.id, args.where.languageTag),
		}
	}

	const variant = matchVariant(copy, args.where.languageTag, args.where.match)
	if (!variant) {
		return { error: new MessageVariantDoesNotExistError(message.id, args.where.languageTag) }
	}

	variant.pattern = args.data
	return { data: copy }
}

/**
 * Returns the specific variant defined by selectors or undefined
 *
 * @example
 *  const variant = matchVariant(message, languageTag: "en", match: ["male"])
 */
const matchVariant = (
	message: Message,
	languageTag: LanguageTag,
	match: Variant["match"]
): Variant | undefined => {
	const translation = message.translations.find(
		(translation) => translation.languageTag === languageTag
	)
	if (!translation) return undefined

	for (const variant of translation.variants) {
		let isMatch = true
		//check if vaiant is a match
		if (variant.match.length > 0) {
			variant.match.map((value, index) => {
				if (match && match[index] !== value) {
					isMatch = false
				}
			})
		}

		if (!translation.selectors || !match || match.length !== translation.selectors.length) {
			isMatch = false
		}

		if (isMatch) {
			return variant
		}
	}
	return undefined
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
	match?: Variant["match"]
): Variant | undefined => {
	const translation = message.translations.find(
		(translation) => translation.languageTag === languageTag
	)
	if (!translation) return undefined

	// resolve preferenceSelectors to match length and order of message selectors
	const index: Record<string, any> = {}

	for (const variant of translation.variants) {
		let isMatch = true

		// if slector and stored match are not the same throw error
		if (variant.match.length !== translation.selectors.length) {
			return undefined
		}

		//check if variant is a match
		if (variant.match.length > 0) {
			variant.match.map((value, index) => {
				if (match && match[index] !== value && value !== "*") {
					isMatch = false
				}
			})
		}
		if (isMatch && match && match.length > 0) {
			// eslint-disable-next-line no-inner-declarations
			function recursiveAddToIndex(
				currentIndex: Record<string, any>,
				selectorIndex: number,
				selectorLength: number,
				variant: Variant
			) {
				const key = variant.match[selectorIndex]
				if (key) {
					if (selectorIndex === 1) {
						currentIndex[key] = variant
					} else {
						if (!currentIndex[key]) {
							currentIndex[key] = {}
						}
						recursiveAddToIndex(currentIndex[key], selectorIndex + 1, selectorLength, variant)
					}
				}
			}
			recursiveAddToIndex(
				index,
				0,
				translation.selectors ? translation.selectors.length - 1 : 0,
				variant
			)
		} else if (isMatch && !match) {
			return variant
		}
	}

	// if number of selectors and numver of required match is not the same match catch all
	if (!translation.selectors || !match || match.length !== translation.selectors.length) {
		const catchAllMatcher: Array<string> = []
		const selectorCount = translation.selectors.length
		catchAllMatcher.push("*")
		for (let i = 0; i < selectorCount - 1; i++) {
			catchAllMatcher.push("*")
		}
		return translation.variants.find(
			(v) => JSON.stringify(v.match) === JSON.stringify(catchAllMatcher)
		)
	}

	// if selector is empty match empty variant match
	if (translation.selectors && translation.selectors.length === 0) {
		return translation.variants.find((v) => JSON.stringify(v.match) === "[]")
	}

	//find the most specific variant
	const findOptimalMatch = (
		index: Record<string, any>,
		selectors: string[]
	): Variant | undefined => {
		const keys = Object.keys(index)

		for (const key of keys) {
			if (key === selectors[0] || key === "*") {
				const nextOptimal = selectors.slice(1)

				if (nextOptimal.length === 0) {
					return (index[key] as Variant) || undefined
				}

				const match = findOptimalMatch(index[key] as Record<string, any>, nextOptimal)

				if (match !== undefined) {
					return match
				}
			}
		}
		return undefined
	}

	return findOptimalMatch(index, match || [])
}
