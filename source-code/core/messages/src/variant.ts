/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { LanguageTag } from "@inlang/language-tag"
import type { Message, Variant } from "./schema.js"
import type { Result } from "@inlang/result"
import {
	MessagePatternsForLanguageTagDoNotExistError,
	MessageVariantAlreadyExistsError,
	MessageVariantDoesNotExistError,
} from "./errors.js"

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
	args: {
		where: {
			languageTag: LanguageTag
			selectors?: Variant["match"]
		}
	},
): Variant | undefined {
	if (message.body[args.where.languageTag] === undefined) {
		return undefined
	}
	const variant = matchMostSpecificVariant(message, args.where.languageTag, args.where.selectors)
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
		where: {
			languageTag: LanguageTag
		}
		data: Variant
	},
): Result<Message, MessageVariantAlreadyExistsError> {
	const copy: Message = structuredClone(message)
	// check if languageTag exists
	copy.body[args.where.languageTag] ??= []

	// check if variant already exists
	if (matchVariant(copy, args.where.languageTag, args.data.match)) {
		return { error: new MessageVariantAlreadyExistsError(message.id, args.where.languageTag) }
	}

	// need to resolve selectors to match length and order of message selectors
	copy.body[args.where.languageTag]!.push({
		...args.data,
		match: resolveSelector(copy.selectors, args.data.match),
	})
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
export function updateVariantPattern(
	message: Message,
	args: {
		where: {
			languageTag: LanguageTag
			selectors: Record<string, string>
		}
		data: Variant["pattern"]
	},
): Result<Message, MessageVariantDoesNotExistError | MessagePatternsForLanguageTagDoNotExistError> {
	const copy: Message = structuredClone(message)
	if (copy.body[args.where.languageTag] === undefined) {
		return {
			error: new MessagePatternsForLanguageTagDoNotExistError(message.id, args.where.languageTag),
		}
	}
	const variant = matchVariant(copy, args.where.languageTag, args.where.selectors)
	if (variant === undefined) {
		return { error: new MessageVariantDoesNotExistError(message.id, args.where.languageTag) }
	}
	if (variant) {
		variant.pattern = args.data
		return { data: copy }
	}
	return { error: new MessageVariantDoesNotExistError(message.id, args.where.languageTag) }
}

/**
 * Returns the specific variant defined by selectors or undefined
 *
 * @example
 *  const variant = matchVariant(message, languageTag: "en", selectors: { gender: "male" })
 */
const matchVariant = (
	message: Message,
	languageTag: LanguageTag,
	selectors: Record<string, string>,
): Variant | undefined => {
	// resolve preferenceSelectors to match length and order of message selectors
	const resolvedSelectors = resolveSelector(message.selectors, selectors)

	for (const variant of message.body[languageTag]!) {
		let isMatch = true
		//check if vaiant is a match
		for (const [key, value] of Object.entries(variant.match)) {
			if (resolvedSelectors[key] !== value) {
				isMatch = false
			}
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
	selectors?: Record<string, string>,
): Variant | undefined => {
	// make selector undefined if empty object
	selectors = JSON.stringify(selectors) === "{}" ? undefined : selectors

	// resolve preferenceSelectors to match length and order of message selectors
	const resolvedSelectors = resolveSelector(message.selectors, selectors)
	const index: Record<string, any> = {}

	for (const variant of message.body[languageTag]!) {
		let isMatch = true

		//check if variant is a match
		for (const [key, value] of Object.entries(variant.match)) {
			if (resolvedSelectors[key] !== value && value !== "*") {
				isMatch = false
			}
		}
		if (isMatch && selectors) {
			// add variant to nested index
			// eslint-disable-next-line no-inner-declarations
			function recursiveAddToIndex(
				currentIndex: Record<string, any>,
				currentKeys: Message["selectors"],
				variant: Variant,
			) {
				if (currentKeys[0]?.name) {
					const key = variant.match[currentKeys[0].name]
					if (key) {
						if (currentKeys.length === 1) {
							currentIndex[key] = variant
						} else {
							if (!currentIndex[key]) {
								currentIndex[key] = {}
							}
							recursiveAddToIndex(currentIndex[key], currentKeys.slice(1), variant)
						}
					}
				}
			}
			recursiveAddToIndex(index, message.selectors, variant)
		} else if (isMatch && !selectors) {
			return variant
		}
	}

	//find the most specific variant
	const findOptimalMatch = (
		index: Record<string, any>,
		selectors: string[],
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

	return findOptimalMatch(index, Object.values(resolvedSelectors))
}

/**
 * Returns resolved selector.
 * -> Adds all possible selectors, if not defined it adds '*'. Order is determined by messageSelectors
 *
 * @example
 *  const variant = resolveSelector(["gender","count"], selector: {count: "2"})
 */
const resolveSelector = (
	messageSelectors: Message["selectors"],
	selectors?: Record<string, string>,
): Record<string, string> => {
	const resolvedSelectors: Record<string, string> = {}
	if (!selectors) return {}
	for (const messageSelector of messageSelectors) {
		resolvedSelectors[messageSelector.name] = selectors[messageSelector.name] ?? "*"
	}
	return resolvedSelectors
}
