import { i } from "../services/codegen/identifier.js"
import { inputsType, type InputTypeMap } from "./inputsType.js"
import { isValidJSIdentifier } from "../services/valid-js-identifier/index.js"
import { optionsType } from "./optionsType.js"
import { reexportAliases } from "./aliases.js"
import type { LanguageTag, MessageBundle } from "@inlang/sdk/v2"

export const bundleIndexFunction = (args: {
	bundle: MessageBundle
	inputTypes: InputTypeMap
	availableLanguageTags: LanguageTag[]
}) => {
	const hasInputs = Object.keys(args.inputTypes).length > 0

	return `/**
 * This message has been compiled by [inlang paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs).
 *
 * - Don't edit the message's code. Use [Sherlock (VS Code extension)](https://inlang.com/m/r7kp499g/app-inlang-ideExtension),
 *   the [web editor](https://inlang.com/m/tdozzpar/app-inlang-finkLocalizationEditor) instead, or edit the translation files manually.
 * 
 * - The params are NonNullable<unknown> because the inlang SDK does not provide information on the type of a param (yet).
 * 
 * ${inputsType(args.inputs, true)}
 * ${optionsType({ languageTags: args.availableLanguageTags })}
 * @returns {string}
 */
/* @__NO_SIDE_EFFECTS__ */
export const ${args.bundle.id} = (params ${hasInputs ? "" : "= {}"}, options = {}) => {
	return {
${args.availableLanguageTags
	// sort language tags alphabetically to make the generated code more readable
	.sort((a, b) => a.localeCompare(b))
	.map((tag) => `\t\t${isValidJSIdentifier(tag) ? tag : `"${tag}"`}: ${i(tag)}.${args.bundle.id}`)
	.join(",\n")}
	}[options.languageTag ?? languageTag()](${hasInputs ? "params" : ""})
}
${reexportAliases(args.bundle)}
`
}
