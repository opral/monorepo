import { LanguageTag, type Message } from "@inlang/sdk"
import { compilePattern } from "./compilePattern.js"
import { paramsType, type Params } from "./paramsType.js"
import { optionsType } from "./optionsType.js"
import { isValidJSIdentifier } from "../services/valid-js-identifier/index.js"
import { i } from "../services/codegen/identifier.js"
import { escapeForDoubleQuoteString } from "../services/codegen/escape.js"
import { lookup } from "@inlang/language-tag"

type Resource = {
	index: string
	[languageTag: string]: string
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
	availableLanguageTags: LanguageTag[],
	sourceLanguageTag: LanguageTag
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

		if (!availableLanguageTags.includes(variant.languageTag)) {
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

	const resource: Resource = {
		index: messageIndexFunction({ message, params, availableLanguageTags }),
	}

	for (const languageTag of availableLanguageTags) {
		const compiledPattern = compiledPatterns[languageTag]

		//If there is a pattern for the language tag, compile it, otherwise fallback
		if (compiledPattern) {
			resource[languageTag] = messageFunction({ message, params, languageTag, compiledPattern })
		} else {
			//Do a lookup using all the languages that do have the pattern
			const fallbackLanguage = lookup(languageTag, {
				languageTags: Object.keys(compiledPatterns),
				defaultLanguageTag: sourceLanguageTag,
			})

			//Get the compiled pattern for the fallback language - if it exists
			//It may not exist if the fallback language is the source language
			const compiledFallbackPattern = compiledPatterns[fallbackLanguage]

			//if the fallback has the pattern, reexport the message from the fallback language
			resource[languageTag] = compiledFallbackPattern
				? reexportMessage(message, fallbackLanguage)
				: messageIdFallback(message, languageTag)
		}
	}

	return resource
}

const messageIndexFunction = (args: {
	message: Message
	params: Params
	availableLanguageTags: LanguageTag[]
}) => {
	const hasParams = Object.keys(args.params).length > 0

	return `/**
 * This message has been compiled by [inlang paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs).
 *
 * - Don't edit the message's code. Use [Sherlock (VS Code extension)](https://inlang.com/m/r7kp499g/app-inlang-ideExtension),
 *   the [web editor](https://inlang.com/m/tdozzpar/app-inlang-finkLocalizationEditor) instead, or edit the translation files manually.
 * 
 * - The params are NonNullable<unknown> because the inlang SDK does not provide information on the type of a param (yet).
 * 
 * ${paramsType(args.params, true)}
 * ${optionsType({ languageTags: args.availableLanguageTags })}
 * @returns {string}
 */
/* @__NO_SIDE_EFFECTS__ */
export const ${args.message.id} = (params ${hasParams ? "" : "= {}"}, options = {}) => {
	return {
${args.availableLanguageTags
	// sort language tags alphabetically to make the generated code more readable
	.sort((a, b) => a.localeCompare(b))
	.map((tag) => `\t\t${isValidJSIdentifier(tag) ? tag : `"${tag}"`}: ${i(tag)}.${args.message.id}`)
	.join(",\n")}
	}[options.languageTag ?? languageTag()](${hasParams ? "params" : ""})
}
${reexportAliases(args.message)}
`
}

const messageFunction = (args: {
	message: Message
	params: Params
	languageTag: LanguageTag
	compiledPattern: string
}) => {
	const hasParams = Object.keys(args.params).length > 0

	return `
	
/**
 * ${paramsType(args.params, false)}
 * @returns {string}
 */
/* @__NO_SIDE_EFFECTS__ */
export const ${args.message.id} = (${hasParams ? "params" : ""}) => ${args.compiledPattern}
${reexportAliases(args.message)}
`
}

function reexportMessage(message: Message, fromLanguageTag: string) {
	const exports: string[] = [message.id]

	if (message.alias["default"] && message.id !== message.alias["default"]) {
		exports.push(message.alias["default"])
	}

	return `export { ${exports.join(", ")} } from "./${fromLanguageTag}.js"`
}

function messageIdFallback(message: Message, languageTag: string) {
	return `/**
* Failed to resolve message ${message.id} for languageTag "${languageTag}". 
* @returns {string}
*/
/* @__NO_SIDE_EFFECTS__ */
export const ${message.id} = () => "${escapeForDoubleQuoteString(message.id)}"
${reexportAliases(message)}
`
}

/**
 * Returns re-export statements for each alias of a message.
 * If no aliases are present, this function returns an empty string.
 *
 * @param message
 */
function reexportAliases(message: Message) {
	let code = ""

	if (message.alias["default"] && message.id !== message.alias["default"]) {
		code += `
/**
 * Change the reference from the alias \`m.${message.alias["default"]}()\` to \`m.${message.id}()\`:
 * \`\`\`diff
 * - m.${message.alias["default"]}()
 * + m.${message.id}()
 * \`\`\`
 * ---
 * \`${message.alias["default"]}\` is an alias for the message \`${message.id}\`.
 * Referencing aliases instead of the message ID has downsides like:
 *
 * - The alias might be renamed in the future, breaking the code.
 * - Constant naming convention discussions.
 *
 * Read more about aliases and their downsides here 
 * @see inlang.com/link.
 * ---
 * @deprecated reference the message by id \`m.${message.id}()\` instead
 * 
 * @param {Parameters<typeof ${message.id}>} args
 * @returns {ReturnType<typeof ${message.id}>}
 */
export const ${message.alias["default"]} = (...args) => ${message.id}(...args);
`
	}

	return code
}
