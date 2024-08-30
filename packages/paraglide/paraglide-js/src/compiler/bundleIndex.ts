import { jsIdentifier } from "../services/codegen/identifier.js"
import { inputsType, type InputTypeMap } from "./inputsType.js"
import { isValidJSIdentifier } from "../services/valid-js-identifier/index.js"
import { optionsType } from "./optionsType.js"
import { escapeForDoubleQuoteString } from "~/services/codegen/escape.js"
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
	const hasInputs = args.bundle.messages.find((m) => m.declarations.length > 0)

	let code = `/**
 * This translation has been compiled by [@inlang/paraglide-js](https://inlang.com/m/gerre34r/library-inlang-paraglideJs).
 *
 * - Don't edit this code. Instead use [Sherlock (VS Code extension)](https://inlang.com/m/r7kp499g/app-inlang-ideExtension) or
 *   [Fink](https://inlang.com/m/tdozzpar/app-inlang-finkLocalizationEditor) to edit the translation instead, or edit the translation files manually.
 * 
 * ${inputsType(args.typeRestrictions, true)}
 * ${optionsType({ languageTags: args.availableLanguageTags })}
 * @returns {string}
 */
/* @__NO_SIDE_EFFECTS__ */
const ${jsIdentifier(args.bundle.id)} = (inputs ${hasInputs ? "" : "= {}"}, options = {}) => {
	return {
${args.availableLanguageTags
	// sort language tags alphabetically to make the generated code more readable
	.sort((a, b) => a.localeCompare(b))
	.map(
		(tag) =>
			`\t\t${isValidJSIdentifier(tag) ? tag : `"${tag}"`}: ${jsIdentifier(tag)}.${args.bundle.id}`
	)
	.join(",\n")}
	}[options.languageTag ?? languageTag()](${hasInputs ? "inputs" : ""})
}`

	// export the index function
	if (isValidJSIdentifier(args.bundle.id)) {
		code += `\nexport { ${args.bundle.id} }`
	} else {
		code += `\nexport { ${jsIdentifier(args.bundle.id)} as "${escapeForDoubleQuoteString(args.bundle.id)}" }`
	}

	const aliases = Object.values(args.bundle.alias)
	for (const alias of aliases) {
		if (isValidJSIdentifier(alias)) {
			code += `\nexport { ${jsIdentifier(args.bundle.id)} as ${alias} }`
		} else {
			code += `\nexport { ${jsIdentifier(args.bundle.id)} as "${escapeForDoubleQuoteString(alias)}" }`
		}
	}

	return code
}
