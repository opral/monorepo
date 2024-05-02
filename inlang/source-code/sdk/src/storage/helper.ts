import type { AST } from "@inlang/message"
import * as LegacyFormat from "@inlang/message"
import { fromLegacyMessage, toLegacyMessage } from "../legacy.js"

const fileExtension = ".json"

export function normalizeMessage(legacyMessage: LegacyFormat.Message) {
	// order keys in message
	const messageWithSortedKeys: any = {}
	for (const key of Object.keys(legacyMessage).sort()) {
		messageWithSortedKeys[key] = (legacyMessage as any)[key]
	}

	// order variants
	messageWithSortedKeys["variants"] = messageWithSortedKeys["variants"]
		.sort((variantA: LegacyFormat.Variant, variantB: LegacyFormat.Variant) => {
			// compare by language
			const languageComparison = variantA.languageTag.localeCompare(variantB.languageTag)

			// if languages are the same, compare by match
			if (languageComparison === 0) {
				return variantA.match.join("-").localeCompare(variantB.match.join("-"))
			}

			return languageComparison
		})
		// order keys in each variant
		.map((variant: LegacyFormat.Variant) => {
			const variantWithSortedKeys: any = {}
			for (const variantKey of Object.keys(variant).sort()) {
				if (variantKey === "pattern") {
					variantWithSortedKeys[variantKey] = (variant as any)["pattern"].map((token: any) => {
						const tokenWithSortedKey: any = {}
						for (const tokenKey of Object.keys(token).sort()) {
							tokenWithSortedKey[tokenKey] = token[tokenKey]
						}
						return tokenWithSortedKey
					})
				} else {
					variantWithSortedKeys[variantKey] = (variant as any)[variantKey]
				}
			}
			return variantWithSortedKeys
		})

	return messageWithSortedKeys as LegacyFormat.Message
}

export function stringifyMessage(legacyMessage: LegacyFormat.Message) {
	return JSON.stringify(normalizeMessage(legacyMessage), undefined, 4)
}

export function getMessageIdFromPath(path: string) {
	if (!path.endsWith(fileExtension)) return

	const cleanedPath = path.replace(/\/$/, "") // This regex matches a trailing slash and replaces it with an empty string
	const messageFileName = cleanedPath.split("/").join("_") // we split by the first leading namespace or _ separator - make sure slashes don't exit in the id
	// const messageFileName = pathParts.at(-1)!

	const lastDotIndex = messageFileName.lastIndexOf(".")

	// Extract until the last dot (excluding the dot)
	return messageFileName.slice(0, Math.max(0, lastDotIndex))
}

export function getPathFromMessageId(id: string) {
	const path = id.replace("_", "/") + fileExtension
	return path
}

/**
 * Returns a copy of a message object with sorted variants and object keys.
 * This produces a deterministic result when passed to stringify
 * independent of the initialization order.
 */
export function normalizeMessageBundle(messageBundle: AST.MessageBundle) {
	const messageWithSortedKeys = sortRecord(messageBundle)

	// order variants
	messageWithSortedKeys["messages"] = messageWithSortedKeys["messages"]
		.sort((translationA, translationB) => {
			// compare by language
			const languageComparison = translationA.locale.localeCompare(translationB.locale, "en")

			// if languages are the same, compare by selectors
			if (languageComparison === 0) {
				return translationA.selectors
					.join("-")
					.localeCompare(translationB.selectors.join("-"), "en")
			}

			return languageComparison
		})
		// order keys in each translation
		.map((translation) => {
			const translationWithSortedKeys = sortRecord(translation)

			//order variants
			translationWithSortedKeys.variants = translationWithSortedKeys.variants.map((variant) => {
				const variantWithSortedKeys = sortRecord(variant)
				variantWithSortedKeys.pattern = variantWithSortedKeys.pattern.map(sortRecord)
				return variantWithSortedKeys
			})

			//sort by match
			translationWithSortedKeys.variants = translationWithSortedKeys.variants.sort(
				(variantA, variabtB) => {
					return variantA.match.join("-").localeCompare(variabtB.match.join("-"), "en")
				}
			)

			return translationWithSortedKeys
		})

	return messageWithSortedKeys as AST.MessageBundle
}

export function stringifyMessageBundle(message: AST.MessageBundle) {
	return JSON.stringify(normalizeMessageBundle(message), undefined, 4)
}

function sortRecord<T extends Record<string, unknown>>(record: T): T {
	return Object.fromEntries(
		Object.entries(record).sort(([key1], [key2]) => key1.localeCompare(key2, "en"))
	) as T
}
