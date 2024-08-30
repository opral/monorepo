import type { BundleNested, MessageNested } from "@inlang/sdk2"
import { bundleIndexFunction } from "./bundleIndex.js"
import { compileMessage } from "./compileMessage.js"
import { mergeTypeRestrictions, type Compilation } from "./types.js"
import type { Registry } from "./registry.js"

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
export const compileBundle = (args: {
	bundle: BundleNested
	fallbackMap: Record<string, string | undefined>
	registry: Registry
}): Resource => {
	const compiledMessages: Record<string, Compilation<MessageNested>> = {}

	let typeRestrictions = {}
	for (const message of args.bundle.messages) {
		if (compiledMessages[message.locale]) {
			throw new Error(`Duplicate language tag: ${message.locale}`)
		}

		const compiled = compileMessage(message, args.registry)
		// set the pattern for the language tag
		compiledMessages[message.locale] = compiled
		typeRestrictions = mergeTypeRestrictions(compiled.typeRestrictions, typeRestrictions)
	}

	const compiledBundle: Compilation<BundleNested> = {
		code: bundleIndexFunction({
			bundle: args.bundle,
			typeRestrictions,
			availableLanguageTags: Object.keys(args.fallbackMap),
		}),
		typeRestrictions,
		source: args.bundle,
	}

	return {
		bundle: compiledBundle,
		messages: compiledMessages,
	}
}
