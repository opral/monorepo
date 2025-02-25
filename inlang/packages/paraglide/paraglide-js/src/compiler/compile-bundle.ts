import type { Bundle, BundleNested, Message } from "@inlang/sdk";
import { compileMessage } from "./compile-message.js";
import type { Compiled } from "./types.js";
import { jsDocBundleFunctionTypes } from "./jsdoc-types.js";
import { toSafeModuleId } from "./safe-module-id.js";
import { escapeForDoubleQuoteString } from "../services/codegen/escape.js";

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
}): CompiledBundleWithMessages => {
	const compiledMessages: Record<string, Compiled<Message>> = {};

	for (const message of args.bundle.messages) {
		if (compiledMessages[message.locale]) {
			throw new Error(`Duplicate locale: ${message.locale}`);
		}

		const compiledMessage = compileMessage(
			args.bundle.declarations,
			message,
			message.variants
		);

		// set the pattern for the language tag
		compiledMessages[message.locale] = compiledMessage;
	}

	return {
		bundle: compileBundleFunction({
			bundle: args.bundle,
			availableLocales: Object.keys(args.fallbackMap),
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
}): Compiled<Bundle> => {
	const inputs = args.bundle.declarations.filter(
		(decl) => decl.type === "input-variable"
	);
	const hasInputs = inputs.length > 0;

	const safeBundleId = toSafeModuleId(args.bundle.id);

	const isSafeBundleId = safeBundleId === args.bundle.id;

	let code = `/**
* This function has been compiled by [Paraglide JS](https://inlang.com/m/gerre34r).
*
* - Changing this function will be over-written by the next build.
*
* - If you want to change the translations, you can either edit the source files e.g. \`en.json\`, or
* use another inlang app like [Fink](https://inlang.com/m/tdozzpar) or the [VSCode extension Sherlock](https://inlang.com/m/r7kp499g).
* ${jsDocBundleFunctionTypes({ inputs, locales: args.availableLocales })}
*/
/* @__NO_SIDE_EFFECTS__ */
${isSafeBundleId ? "export" : ""} const ${safeBundleId} = (inputs${hasInputs ? "" : "= {}"}, options = {}) => {
	const locale = options.locale ?? getLocale()
	${args.availableLocales
		.map(
			(locale, index) =>
				`${index > 0 ? "	" : ""}if (locale === "${locale}") return ${toSafeModuleId(locale)}.${safeBundleId}(inputs)`
		)
		.join("\n")}
	return "${args.bundle.id}"
};`;

	if (isSafeBundleId === false) {
		code += `\nexport { ${safeBundleId} as "${escapeForDoubleQuoteString(args.bundle.id)}" }`;
	}

	return {
		code,
		node: args.bundle,
	};
};
