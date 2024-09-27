import type { Bundle, BundleNested, Message } from "@inlang/sdk2"
import { compileMessage } from "./compileMessage.js"
import type { Registry } from "./registry.js"
import { jsIdentifier } from "~/services/codegen/identifier.js"
import { isValidJSIdentifier } from "~/services/valid-js-identifier/index.js"
import { escapeForDoubleQuoteString } from "~/services/codegen/escape.js"
import type { Compiled } from "./types.js"
import { jsDocBundleComment, jsDocMessageComment } from "./jsDocComment.js"

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
		// add types to the compiled message function
		const inputs = args.bundle.declarations.filter((decl) => decl.type === "input-variable")
		compiledMessage.code = `${jsDocMessageComment({ inputs })}\n${compiledMessage.code}`

		// set the pattern for the language tag
		compiledMessages[message.locale] = compiledMessage
	}

	return {
		bundle: compileBundleFunction({
			bundle: args.bundle,
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
	 * The language tags which are available
	 */
	availableLanguageTags: string[]
}): Compiled<Bundle> => {
	const inputs = args.bundle.declarations.filter((decl) => decl.type === "input-variable")
	const hasInputs = inputs.length > 0

	let code = `
${jsDocBundleComment({ inputs, locales: args.availableLanguageTags })}
/* @__NO_SIDE_EFFECTS__ */
const ${jsIdentifier(args.bundle.id)} = (inputs ${hasInputs ? "" : "= {}"}, options = {}) => {
	const locale = options.locale ?? options.languageTag ?? getLocale()
	${args.availableLanguageTags
		.map(
			(locale) =>
				`if (locale === "${locale}") return ${jsIdentifier(locale)}.${args.bundle.id}(inputs)`
		)
		.join("\n")}
	return "${args.bundle.id}"
	}
`

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
