import type { BundleNested } from "@inlang/sdk2"
import { inputsType, type InputTypeMap } from "./inputsType.js"
import { isValidJSIdentifier } from "../services/valid-js-identifier/index.js"
import { escapeForDoubleQuoteString } from "../services/codegen/escape.js"
import { reexportAliases } from "./aliases.js"
import { bundleIndexFunction } from "./messageIndex.js"
import { compileMessage } from "./compileMessage.js"

type LanguageTag = string
type Resource = {
	/**
	 * The original message-bundle
	 */
	source: BundleNested
	/**
	 * The parameters needed for this message
	 */
	params: InputTypeMap
	/**
	 * The index-message function for this message
	 */
	index: string
	/**
	 * The message-function for each language
	 */
	translations: {
		[languageTag: string]: string
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
	fallbackMap: Record<LanguageTag, LanguageTag | undefined>
): Resource => {
	if (!isValidJSIdentifier(bundle.id)) {
		throw new Error(
			`Cannot compile message with ID "${bundle.id}".\n\nThe message is not a valid JavaScript variable name. Please choose a different ID.\n\nTo detect this issue during linting, use the valid-js-identifier lint rule: https://inlang.com/m/teldgniy/messageLintRule-inlang-validJsIdentifier`
		)
	}

	const compiledMessages: Record<LanguageTag, string> = {}
	// parameter names and TypeScript types
	// only allowing types that JS transpiles to strings under the hood like string and number.
	// the pattern nodes must be extended to hold type information in the future.
	const params: InputTypeMap = {}

	for (const message of bundle.messages) {
		if (compiledMessages[message.locale]) {
			throw new Error(`Duplicate language tag: ${message.locale}`)
		}

		const compiled = compileMessage(message)
		// set the pattern for the language tag
		compiledMessages[message.locale] = compiled
	}

	const resource: Resource = {
		source: bundle,
		params,
		index: bundleIndexFunction({
			bundle,
			inputTypes: params,
			availableLanguageTags: Object.keys(fallbackMap),
		}),
		translations: Object.fromEntries(
			Object.entries(fallbackMap).map(([languageTag, fallbackLanguage]) => {
				const compiledPattern = compiledMessages[languageTag]

				return [
					languageTag,
					compiledPattern
						? messageFunction({
								bundle,
								inputTypes: params,
								languageTag,
								compiledPattern,
						  })
						: fallbackLanguage
						? reexportMessage(bundle, fallbackLanguage, output)
						: messageIdFallback(bundle, languageTag),
				]
			})
		),
	}

	return resource
}

const messageFunction = (args: {
	bundle: BundleNested
	inputTypes: InputTypeMap
	languageTag: LanguageTag
	compiledPattern: string
}) => {
	const inputs = args.bundle.declarations.filter((decl) => decl.type === "input")
	const hasInputs = inputs.length > 0

	return `
/**
 * ${inputsType(args.inputTypes, false)}
 * @returns {string}
 */
/* @__NO_SIDE_EFFECTS__ */
export const ${args.bundle.id} = (${hasInputs ? "inputs" : ""}) => {
	return ${args.compiledPattern}
} 
`
}

function reexportMessage(bundle: BundleNested, fromLanguageTag: string) {
	const exports: string[] = [bundle.id]

	if (bundle.alias["default"] && bundle.id !== bundle.alias["default"]) {
		exports.push(bundle.alias["default"])
	}

	return `export { ${exports.join(", ")} } from "./${fromLanguageTag}.js"`
}

function messageIdFallback(bundle: BundleNested, languageTag: string) {
	return `/**
 * Failed to resolve message ${bundle.id} for languageTag "${languageTag}". 
 * @returns {string}
 */
/* @__NO_SIDE_EFFECTS__ */
export const ${bundle.id} = () => "${escapeForDoubleQuoteString(bundle.id)}"
${reexportAliases(bundle)}`
}
