import type { BundleNested } from "@inlang/sdk2"
import { isValidJSIdentifier } from "../services/valid-js-identifier/index.js"
import { bundleIndexFunction } from "./bundleIndex.js"
import { compileMessage } from "./compileMessage.js"
import { mergeTypeRestrictions, type Compilation } from "./types.js"

type Resource = {
	/** The bundle that was used to generate this resource */
	source: BundleNested
	/** The compilation result for the bundle index */
	bundle: Compilation
	/** The compilation results for the languages */
	messages: {
		[languageTag: string]: Compilation
	}
}

/**
 * Returns the compiled messages for the given message.
 *
 * @example
 *   {
 *      index: "export const hello_world = (params) => { ... }",
 *      en: "export const hello_world = (params) => { ... }",
 *      de: "export const hello_world = (params) => { ... }",
 *   }
 *
 * @param bundle The message to compile
 * @param lookupTable A table that maps language tags to their fallbacks.
 */
export const compileBundle = (
	bundle: BundleNested,
	fallbackMap: Record<string, string | undefined>
): Resource => {
	if (!isValidJSIdentifier(bundle.id)) {
		throw new Error(
			`Cannot compile message with ID "${bundle.id}".\n\nThe message is not a valid JavaScript variable name. Please choose a different ID.\n\nTo detect this issue during linting, use the valid-js-identifier lint rule: https://inlang.com/m/teldgniy/messageLintRule-inlang-validJsIdentifier`
		)
	}

	const compiledMessages: Record<string, Compilation> = {}

	let typeRestrictions = {}
	for (const message of bundle.messages) {
		if (compiledMessages[message.locale]) {
			throw new Error(`Duplicate language tag: ${message.locale}`)
		}

		const compiled = compileMessage(message)
		// set the pattern for the language tag
		compiledMessages[message.locale] = compiled
		typeRestrictions = mergeTypeRestrictions(typeRestrictions, compiled.typeRestrictions)
	}

	const compiledBundle: Compilation = {
		code: bundleIndexFunction({
			bundle,
			typeRestrictions,
			availableLanguageTags: Object.keys(fallbackMap),
		}),
		typeRestrictions,
	}

	return {
		source: bundle,
		bundle: compiledBundle,
		messages: compiledMessages,
	}
}
