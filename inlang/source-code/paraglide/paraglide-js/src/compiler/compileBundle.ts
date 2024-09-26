import type { Bundle, BundleNested, Message } from "@inlang/sdk2"
import { compileMessage } from "./compileMessage.js"
import type { Registry } from "./registry.js"
import { inputsType, type InputTypeMap } from "./inputsType.js"
import { optionsType } from "./optionsType.js"
import { jsIdentifier } from "~/services/codegen/identifier.js"
import { isValidJSIdentifier } from "~/services/valid-js-identifier/index.js"
import { escapeForDoubleQuoteString } from "~/services/codegen/escape.js"
import type { Compiled } from "./types.js"

export type Resource = {
	/** The compilation result for the bundle index */
	bundle: Compiled<Bundle>
	/** The compilation results for the languages */
	messages: {
		[locale: string]: Compiled<Message>
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
	const compiledMessages: Record<string, Compiled<Message>> = {}

	for (const message of args.bundle.messages) {
		if (compiledMessages[message.locale]) {
			throw new Error(`Duplicate language tag: ${message.locale}`)
		}

		const compiledMessage = compileMessage(
			args.bundle.declarations,
			message,
			message.variants,
			args.registry
		)
		// set the pattern for the language tag
		compiledMessages[message.locale] = compiledMessage
	}

	return {
		bundle: compileBundleFunction({
			bundle: args.bundle,
			typeRestrictions: {},
			availableLanguageTags: Object.keys(args.fallbackMap),
		}),
		messages: compiledMessages,
	}
}

const compileBundleFunction = (args: {
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
}): Compiled<Bundle> => {
	const hasInputs = args.bundle.declarations.some((decl) => decl.type === "input-variable")

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

	return {
		code,
		node: args.bundle,
	}
}
