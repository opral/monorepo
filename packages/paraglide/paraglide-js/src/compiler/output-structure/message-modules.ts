import type { ProjectSettings } from "@inlang/sdk";
import type { CompiledBundleWithMessages } from "../compile-bundle.js";
import { escapeForSingleQuoteString } from "../../services/codegen/escape.js";
import { toSafeModuleId } from "../safe-module-id.js";
import { inputsType } from "../jsdoc-types.js";

export function messageReferenceExpression(locale: string, bundleId: string) {
	return `${toSafeModuleId(locale)}_${toSafeModuleId(bundleId)}`;
}

export function generateOutput(
	compiledBundles: CompiledBundleWithMessages[],
	settings: Pick<ProjectSettings, "locales" | "baseLocale">,
	fallbackMap: Record<string, string | undefined>
): Record<string, string> {
	const output: Record<string, string> = {};

	const moduleFilenames = new Set<string>();

	for (const compiledBundle of compiledBundles) {
		const bundleId = compiledBundle.bundle.node.id;
		const safeModuleId = toSafeModuleId(compiledBundle.bundle.node.id);
		const inputs =
			compiledBundle.bundle.node.declarations?.filter(
				(decl) => decl.type === "input-variable"
			) ?? [];

		// bundle file
		const filename = `messages/${safeModuleId}.js`;

		moduleFilenames.add(`${safeModuleId}.js`);

		// create fresh bundle file
		output[filename] = compiledBundle.bundle.code;

                const needsFallback: string[] = [];

                const messages: string[] = [];

		// messages
		for (const locale of settings.locales) {
			const safeLocale = toSafeModuleId(locale);
			const compiledMessage = compiledBundle.messages[locale];

			if (!compiledMessage) {
				needsFallback.push(locale);
			} else {
				messages.push(
					`const ${safeLocale}_${safeModuleId} = ${compiledMessage.code}`
				);
			}
		}

		// add the fallbacks (needs to be done after the messages to avoid referencing
		// the message before they are defined)
                const needsFallbackSet = new Set(needsFallback);
                const emittedFallbacks = new Set<string>();
                const emittingFallbacks = new Set<string>();

                /**
                 * Emits the fallback definition for a locale ensuring that dependent fallbacks
                 * are declared beforehand.
                 *
                 * @example
                 * emitFallback("fr-ca");
                 */
                const emitFallback = (locale: string) => {
                        if (emittedFallbacks.has(locale)) return;
                        if (emittingFallbacks.has(locale)) return;

                        emittingFallbacks.add(locale);

                        const safeLocale = toSafeModuleId(locale);
                        const fallbackLocale = fallbackMap[locale];

                        if (
                                fallbackLocale &&
                                needsFallbackSet.has(fallbackLocale) &&
                                !compiledBundle.messages[fallbackLocale]
                        ) {
                                emitFallback(fallbackLocale);
                        }

                        if (fallbackLocale) {
                                const safeFallbackLocale = toSafeModuleId(fallbackLocale);
                                messages.push(
                                        `/** @type {(inputs: ${inputsType(inputs)}) => string} */\nconst ${safeLocale}_${safeModuleId} = ${safeFallbackLocale}_${safeModuleId};`
                                );
                        } else {
                                messages.push(
                                        `/** @type {(inputs: ${inputsType(inputs)}) => string} */\nconst ${safeLocale}_${safeModuleId} = () => '${escapeForSingleQuoteString(
                                                bundleId
                                        )}'`
                                );
                        }

                        emittingFallbacks.delete(locale);
                        emittedFallbacks.add(locale);
                };

                for (const locale of needsFallback) {
                        emitFallback(locale);
                }

		output[filename] = messages.join("\n\n") + "\n\n" + output[filename];

		// add the imports
		output[filename] =
			`import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../runtime.js';\n\n` +
			output[filename];

		// Add the registry import to the message file
		// if registry is used
		if (output[filename]?.includes("registry.")) {
			output[filename] =
				`import * as registry from '../registry.js'\n` + output[filename];
		}
	}

	// all messages index file
	output["messages/_index.js"] = Array.from(moduleFilenames)
		.map((filename) => `export * from './${filename}'`)
		.join("\n");

	return output;
}
