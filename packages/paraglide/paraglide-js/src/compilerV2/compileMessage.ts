import { LanguageTag, type Message } from "@inlang/sdk"
import { compilePattern } from "./compilePattern.js"
import { paramsType, type Params } from "./paramsType.js"
import { isValidJSIdentifier } from "../services/valid-js-identifier/index.js"
import { escapeForDoubleQuoteString } from "../services/codegen/escape.js"
import { reexportAliases } from "./aliases.js"
import { messageIndexFunction } from "./messageIndex.js"

type Resource = {
	/**
	 * The original message
	 */
	source: Message
	/**
	 * The parameters needed for this message
	 */
	params: Params
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
 * @param message The message to compile
 * @param lookupTable A table that maps language tags to their fallbacks.
 */
export const compileMessage = (
	message: Message,
	fallbackMap: Record<LanguageTag, LanguageTag | undefined>,
	output: "regular" | "message-modules" = "regular"
): Resource => {
	if (!isValidJSIdentifier(message.id)) {
		throw new Error(
			`Cannot compile message with ID "${message.id}".\n\nThe message is not a valid JavaScript variable name. Please choose a different ID.\n\nTo detect this issue during linting, use the valid-js-identifier lint rule: https://inlang.com/m/teldgniy/messageLintRule-inlang-validJsIdentifier`
		)
	}

	const compiledPatterns: Record<LanguageTag, string> = {}
	// parameter names and TypeScript types
	// only allowing types that JS transpiles to strings under the hood like string and number.
	// the pattern nodes must be extended to hold type information in the future.
	let params: Params = {}

	for (const variant of message.variants) {
		if (compiledPatterns[variant.languageTag]) {
			throw new Error(
				`Duplicate language tag: ${variant.languageTag}. Multiple variants for one language tag are not supported in paraglide yet. `
			)
		}

		// merge params
		const { compiled, params: variantParams } = compilePattern(variant.pattern)
		params = { ...params, ...variantParams }

		// set the pattern for the language tag
		compiledPatterns[variant.languageTag] = compiled
	}

	const resource: Resource = {
		source: message,
		params,
		index: messageIndexFunction({
			message,
			params,
			availableLanguageTags: Object.keys(fallbackMap),
		}),
		translations: Object.fromEntries(
			Object.entries(fallbackMap).map(([languageTag, fallbackLanguage]) => {
				const compiledPattern = compiledPatterns[languageTag]

				return [
					languageTag,
					compiledPattern
						? messageFunction({
								message,
								params,
								languageTag,
								compiledPattern,
						  })
						: fallbackLanguage
						? reexportMessage(message, fallbackLanguage, output)
						: messageIdFallback(message, languageTag),
				]
			})
		),
	}

	return resource
}

const messageFunction = (args: {
	message: Message
	params: Params
	languageTag: LanguageTag
	compiledPattern: string
}) => {
	const hasParams = Object.keys(args.params).length > 0

	return `/**
 * ${paramsType(args.params, false)}
 * @returns {string}
 */
/* @__NO_SIDE_EFFECTS__ */
export const ${args.message.id} = (${hasParams ? "params" : ""}) => ${args.compiledPattern}
${reexportAliases(args.message)}`
}

function reexportMessage(
	message: Message,
	fromLanguageTag: string,
	output: "regular" | "message-modules"
) {
	const exports: string[] = [message.id]

	if (message.alias["default"] && message.id !== message.alias["default"]) {
		exports.push(message.alias["default"])
	}

	const from = output === "message-modules" ? `../${fromLanguageTag}.js` : `./${fromLanguageTag}.js`

	return `export { ${exports.join(", ")} } from "${from}"`
}

function messageIdFallback(message: Message, languageTag: string) {
	return `/**
 * Failed to resolve message ${message.id} for languageTag "${languageTag}". 
 * @returns {string}
 */
/* @__NO_SIDE_EFFECTS__ */
export const ${message.id} = () => "${escapeForDoubleQuoteString(message.id)}"
${reexportAliases(message)}`
}
