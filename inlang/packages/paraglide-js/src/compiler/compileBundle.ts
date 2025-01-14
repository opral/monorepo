import type { Bundle, BundleNested, Message } from "@inlang/sdk";
import { compileMessage } from "./compileMessage.js";
import type { Registry } from "./registry.js";
import { jsIdentifier } from "../services/codegen/identifier.js";
import { isValidJSIdentifier } from "../services/valid-js-identifier/index.js";
import { escapeForDoubleQuoteString } from "../services/codegen/escape.js";
import type { Compiled } from "./types.js";
import {
	jsDocBundleFunctionTypes,
	jsDocMessageFunctionTypes,
} from "./jsdoc-types.js";

export type CompiledBundleWithMessages = {
	/** The compilation result for the bundle index */
	bundle: Compiled<Bundle>;
	/** The compilation results for the languages */
	messages: {
		[locale: string]: Compiled<Message>;
	};
};

/**
 * Compiles all the messages in the bundle and returns an index-function + each compiled message
 */
export const compileBundle = (args: {
	bundle: BundleNested;
	fallbackMap: Record<string, string | undefined>;
	registry: Registry;
	emitTs: boolean;
}): CompiledBundleWithMessages => {
	const compiledMessages: Record<string, Compiled<Message>> = {};

	for (const message of args.bundle.messages) {
		if (compiledMessages[message.locale]) {
			throw new Error(`Duplicate language tag: ${message.locale}`);
		}

		const compiledMessage = compileMessage(
			args.bundle.declarations,
			message,
			message.variants,
			args.registry
		);
		// add types to the compiled message function
		const inputs = args.bundle.declarations.filter(
			(decl) => decl.type === "input-variable"
		);
		if (args.emitTs) {
			//
		} else {
			compiledMessage.code = `${jsDocMessageFunctionTypes({ inputs })}\n${compiledMessage.code}`;
		}

		// set the pattern for the language tag
		compiledMessages[message.locale] = compiledMessage;
	}

	return {
		bundle: compileBundleFunction({
			bundle: args.bundle,
			availableLocales: Object.keys(args.fallbackMap),
			emitTs: args.emitTs,
		}),
		messages: compiledMessages,
	};
};

const compileBundleFunction = (args: {
	/**
	 * The bundle to compile
	 */
	bundle: BundleNested;
	/**
	 * The language tags which are available
	 */
	availableLocales: string[];
	emitTs: boolean;
}): Compiled<Bundle> => {
	const inputs = args.bundle.declarations.filter(
		(decl) => decl.type === "input-variable"
	);
	const hasInputs = inputs.length > 0;

	const emitTs = args.emitTs;

	let code = `/**
* This function has been compiled by [Paraglide JS](https://inlang.com/m/gerre34r).
*
* - Changing this function will be over-written by the next build.
*
* - If you want to change the translations, you can either edit the source files e.g. \`en.json\`, or
* use another inlang app like [Fink](https://inlang.com/m/tdozzpar) or the [VSCode extension Sherlock](https://inlang.com/m/r7kp499g).
* ${emitTs ? "" : jsDocBundleFunctionTypes({ inputs, locales: args.availableLocales })}
*/
/* @__NO_SIDE_EFFECTS__ */
const ${jsIdentifier(args.bundle.id)} = (inputs${emitTs ? tsInputType(inputs) : ""} ${hasInputs ? "" : "= {}"}, options ${emitTs ? tsOptionsType(args.availableLocales) : ""} = {}) ${emitTs ? ": string" : ""} => {
	const locale = options.locale ?? options.languageTag ?? getLocale()
	${args.availableLocales
		.map(
			(locale, index) =>
				`${index > 0 ? "	" : ""}if (locale === "${locale}") return ${jsIdentifier(locale)}.${args.bundle.id}(inputs)`
		)
		.join("\n")}
	return "${args.bundle.id}"
}
	`;

	// export the function
	if (isValidJSIdentifier(args.bundle.id)) {
		code += `\nexport { ${args.bundle.id} }`;
	} else {
		code += `\nexport { ${jsIdentifier(args.bundle.id)} as "${escapeForDoubleQuoteString(args.bundle.id)}" }`;
	}

	return {
		code,
		node: args.bundle,
	};
};

function tsOptionsType(locales: string[]): string {
	const localesUnion = locales.map((locale) => `"${locale}"`).join(" | ");
	return `{ locale?: ${localesUnion},/** @deprecated use \`locale\` instead */languageTag?: ${localesUnion} }`;
}

function tsInputType(inputs: { name: string }[]): string {
	const inputParams = inputs
		.map((input) => {
			return `${input.name}: NonNullable<unknown>`;
		})
		.join(", ");
	return `: { ${inputParams} }`;
}