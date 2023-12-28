import { LanguageTag, type Message } from "@inlang/sdk"
import { compilePattern } from "./compilePattern.js"
import { paramsType, type Params } from "./paramsType.js"
import { optionsType } from "./optionsType.js"
import { isValidJSIdentifier } from "../services/valid-js-identifier/index.js"
import { i } from "../services/codegen/identifier.js"
import { escapeForDoubleQuoteString } from "../services/codegen/escape.js"

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
	languageTags: LanguageTag[],
	lookupTable: Record<LanguageTag, LanguageTag[]>
): {
	index: string
	[languageTag: string]: string
} => {
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

		if (!languageTags.includes(variant.languageTag)) {
			throw new Error(
				`The language tag "${variant.languageTag}" is not included in the project's language tags but contained in of your messages. Please add the language tag to your project's language tags or delete the messages with the language tag "${variant.languageTag}" to avoid unexpected type errors.`
			)
		}

		const { compiled, params: variantParams } = compilePattern(variant.pattern)
		// merge params
		params = { ...params, ...variantParams }

		// set the pattern for the language tag
		compiledPatterns[variant.languageTag] = compiled
	}

	return {
		index: messageIndexFunction({ message, params, languageTags }),
		...Object.fromEntries(
			languageTags.map((languageTag) => [
				languageTag,
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				messageFunction({ message, params, languageTag, compiledPatterns, lookupTable }),
			])
		),
	}
}

const messageIndexFunction = (args: {
	message: Message
	params: Params
	languageTags: LanguageTag[]
}) => {
	const hasParams = Object.keys(args.params).length > 0

	return `/**
 * This message has been compiled by [inlang paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs).
 *
 * - Don't edit the message's code. Use the [inlang ide extension](https://inlang.com/m/r7kp499g/app-inlang-ideExtension),
 *   the [web editor](https://inlang.com/m/tdozzpar/app-inlang-editor) instead, or edit the translation files manually.
 * 
 * - The params are NonNullable<unknown> because the inlang SDK does not provide information on the type of a param (yet).
 * 
 * ${paramsType(args.params, true)}
 * ${optionsType({ languageTags: args.languageTags })}
 * @returns {string}
 */
/* @__NO_SIDE_EFFECTS__ */
export const ${args.message.id} = (params ${hasParams ? "" : "= {}"}, options = {}) => {
	return {
${args.languageTags
	// sort language tags alphabetically to make the generated code more readable
	.sort((a, b) => a.localeCompare(b))
	.map((tag) => `\t\t${isValidJSIdentifier(tag) ? tag : `"${tag}"`}: ${i(tag)}.${args.message.id}`)
	.join(",\n")}
	}[options.languageTag ?? languageTag()](${hasParams ? "params" : ""})
}`
}

const messageFunction = (args: {
	message: Message
	params: Params
	languageTag: LanguageTag
	compiledPatterns: Record<string, string>
	lookupTable: Record<LanguageTag, LanguageTag[]>
}) => {
	const compiledPattern = args.compiledPatterns[args.languageTag]
	if (!compiledPattern) return fallbackFunction(args)
	const hasParams = Object.keys(args.params).length > 0

	return `
/**
 * ${paramsType(args.params, false)}
 * @returns {string}
 */
/* @__NO_SIDE_EFFECTS__ */
export const ${args.message.id} = (${hasParams ? "params" : ""}) => ${compiledPattern}`
}

function fallbackFunction(args: {
	message: Message
	params: Params
	languageTag: LanguageTag
	compiledPatterns: Record<string, string>
	lookupTable: Record<LanguageTag, LanguageTag[]>
}) {
	const fallbackLanguage = args.lookupTable[args.languageTag]![1]
	if (!fallbackLanguage)
		return `/**
* Failed to resolve message ${args.message.id} for languageTag "${args.languageTag}". 
*/
export const ${args.message.id} = () => "${escapeForDoubleQuoteString(args.message.id)}"`
	return `export { ${args.message.id} } from "./${fallbackLanguage}.js"`
}