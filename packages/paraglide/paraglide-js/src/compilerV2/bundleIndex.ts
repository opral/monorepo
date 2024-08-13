import { i } from "../services/codegen/identifier.js"
import { inputsType, type InputTypeMap } from "./inputsType.js"
import { isValidJSIdentifier } from "../services/valid-js-identifier/index.js"
import { optionsType } from "./optionsType.js"
import { reexportAliases } from "./aliases.js"
import type { BundleNested } from "@inlang/sdk2"

export const bundleIndexFunction = (args: {
	/**
	 * The bundle to compile
	 */
	bundle: BundleNested
	/**
	 * The type-restrictions acquired from compiling the messages in this bundle
	 */
	typeRestrictions: InputTypeMap
	/**
	 * The language tags which are available
	 */
	availableLanguageTags: string[]
}) => {
	const hasInputs = Object.keys(args.typeRestrictions).length > 0

	return `/**
 * This message has been compiled by [inlang paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs).
 *
 * - Don't edit the message's code. Use [Sherlock (VS Code extension)](https://inlang.com/m/r7kp499g/app-inlang-ideExtension),
 *   [Fink](https://inlang.com/m/tdozzpar/app-inlang-finkLocalizationEditor) instead, or edit the translation files manually.
 * 
 * ${inputsType(args.typeRestrictions, true)}
 * ${optionsType({ languageTags: args.availableLanguageTags })}
 * @returns {string}
 */
/* @__NO_SIDE_EFFECTS__ */
export const ${args.bundle.id} = (inputs ${hasInputs ? "" : "= {}"}, options = {}) => {
	return {
${args.availableLanguageTags
	// sort language tags alphabetically to make the generated code more readable
	.sort((a, b) => a.localeCompare(b))
	.map((tag) => `\t\t${isValidJSIdentifier(tag) ? tag : `"${tag}"`}: ${i(tag)}.${args.bundle.id}`)
	.join(",\n")}
	}[options.languageTag ?? languageTag()](${hasInputs ? "inputs" : ""})
}
${reexportAliases(args.bundle)}
`
}
