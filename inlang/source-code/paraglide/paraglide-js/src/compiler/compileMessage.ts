import { LanguageTag, Variant, type Message } from "@inlang/sdk"
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

	/**
	 * The variants grouped by language tag.
	 */
	const variantsByLanguage: Record<LanguageTag, Variant[]> = {}

	/**
	 * The compiled patterns. Indexed with the index
	 * of their corresponding variant.
	 */
	const compiledPatterns = new Map<Variant, string>()

	let params: Params = Object.fromEntries(
		message.selectors.map((selector) => [selector.name, "NonNullable<unknown>"])
	)

	for (const variant of message.variants) {
		if (!availableLanguageTags.includes(variant.languageTag)) {
			throw new Error(
				`The language tag "${variant.languageTag}" is not included in the project's language tags but contained in of your messages. Please add the language tag to your project's language tags or delete the messages with the language tag "${variant.languageTag}" to avoid unexpected type errors.`
			)
		}

		if (variant.match.length !== message.selectors.length) {
			throw new Error("All variants must provide a selector-value for all selectors")
		}

		const { compiled, params: variantParams } = compilePattern(variant.pattern)
		compiledPatterns.set(variant, compiled)
		params = { ...params, ...variantParams }

		const variantsForLanugage = variantsByLanguage[variant.languageTag] ?? []
		variantsForLanugage.push(variant)
		variantsByLanguage[variant.languageTag] = variantsForLanugage
	}

	const resource: Resource = {
		index: messageIndexFunction({ message, params, availableLanguageTags }),
	}

	for (const languageTag of availableLanguageTags) {
		const variants = variantsByLanguage[languageTag] ?? []

		//If there isn't a variant for the language tag -> fallback
		if (variants.length == 0) {
			//find all the languages that _do_ have the pattern
			const languagesWithPattern = Object.keys(variantsByLanguage).filter((languageTag) => {
				return variantsByLanguage[languageTag]?.some((variant) => variant.pattern.length > 0)
			})

			const fallbackLanguageTag = lookup(languageTag, {
				languageTags: languagesWithPattern,
				defaultLanguageTag: sourceLanguageTag,
			})

			//if the fallback has the pattern, reexport the message from the fallback language
			resource[languageTag] =
				languageTag !== fallbackLanguageTag
					? reexportMessage(message, fallbackLanguageTag)
					: messageIdFallback(message, languageTag)
		} else if (variants.length == 1) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const compiledPattern = compiledPatterns.get(variants[0]!)!

			resource[languageTag] = messageFunction({
				message,
				params,
				languageTag,
				compiledPattern,
			})
		} else {
			let code = "{\n"
			for (const variant of variants) {
				const compiledPattern = compiledPatterns.get(variant)
				if (!compiledPattern) continue

				const predicates = []
				for (let i = 0; i < message.selectors.length; i++) {
					const selector = message.selectors[i]
					const match = variant.match[i]
					if (!selector || !match) continue

					if (match === "*") predicates.push("true")
					else predicates.push(`params.${selector.name} == "${match}"`)
				}

				code += `if (${predicates.join(" && ")}) return ${compiledPattern}\n`
			}
			code += "\n}"

			resource[languageTag] = messageFunction({
				message,
				params,
				languageTag,
				compiledPattern: code,
			})
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
 */
export const ${message.alias["default"]} = ${message.id};
`
	}

	return code
}
