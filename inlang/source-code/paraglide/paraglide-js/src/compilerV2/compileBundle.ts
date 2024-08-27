import type { BundleNested, MessageNested } from "@inlang/sdk2"
import { bundleIndexFunction } from "./bundleIndex.js"
import { compileMessage } from "./compileMessage.js"
import { mergeTypeRestrictions, type Compilation } from "./types.js"

export type Resource = {
	/** The compilation result for the bundle index */
	bundle: Compilation<BundleNested>
	/** The compilation results for the languages */
	messages: {
		[languageTag: string]: Compilation<MessageNested>
	}
}

/**
 * Compiles all the messages in the bundle and returns an index-function + each compiled message
 */
export const compileBundle = (
	bundle: BundleNested,
	fallbackMap: Record<string, string | undefined>
): Resource => {
	const compiledMessages: Record<string, Compilation<MessageNested>> = {}

	let typeRestrictions = {}
	for (const message of bundle.messages) {
		if (compiledMessages[message.locale]) {
			throw new Error(`Duplicate language tag: ${message.locale}`)
		}

		const compiled = compileMessage(message)
		// set the pattern for the language tag
		compiledMessages[message.locale] = compiled
		typeRestrictions = mergeTypeRestrictions(compiled.typeRestrictions, typeRestrictions)
	}

	const compiledBundle: Compilation<BundleNested> = {
		code: bundleIndexFunction({
			bundle,
			typeRestrictions,
			availableLanguageTags: Object.keys(fallbackMap),
		}),
		typeRestrictions,
		source: bundle,
	}

	return {
		bundle: compiledBundle,
		messages: compiledMessages,
	}
}
