import type { ProjectSettings } from "@inlang/sdk";
import type { CompiledBundleWithMessages } from "../compileBundle.js";
import { jsIdentifier } from "../../services/codegen/identifier.js";
import { createRuntime } from "../runtime.js";
import { createRegistry } from "../registry.js";

export function generateLocaleModules(
	compiledBundles: CompiledBundleWithMessages[],
	settings: Pick<ProjectSettings, "locales" | "baseLocale">,
	fallbackMap: Record<string, string | undefined>,
	emitTs: boolean
): Record<string, string> {

	const fileExt = emitTs ? ".ts" : ".js";

	const indexFile = [
		"/* eslint-disable */",
		'import { getLocale } from "./runtime.js"',
		settings.locales
			.map(
				(locale) =>
					`import * as ${jsIdentifier(locale)} from "./messages/${locale}.js"`
			)
			.join("\n"),
		compiledBundles.map(({ bundle }) => bundle.code).join("\n"),
	].join("\n");

	const output: Record<string, string> = {
		["runtime" + fileExt]: createRuntime(settings, emitTs),
		["registry" + fileExt]: createRegistry(emitTs),
		["messages" + fileExt]: indexFile,
	};

	// generate message files
	for (const locale of settings.locales) {
		const filename = emitTs ? `messages/${locale}.ts` : `messages/${locale}.js`;
		let file = `
/* eslint-disable */ 
/** 
 * This file contains language specific functions for tree-shaking. 
 * 
 *! WARNING: Only import from this file if you want to manually
 *! optimize your bundle. Else, import from the \`messages.js\` file. 
 */
import * as registry from '../registry.js'`;

		for (const compiledBundle of compiledBundles) {
			const compiledMessage = compiledBundle.messages[locale];
			const id = jsIdentifier(compiledBundle.bundle.node.id);
			if (!compiledMessage) {
				const fallbackLocale = fallbackMap[locale];
				if (fallbackLocale) {
					// use the fall back locale e.g. render the message in English if the German message is missing
					file += `\nexport { ${id} } from "./${fallbackLocale}.js"`;
				} else {
					// no fallback exists, render the bundleId
					file += `\nexport const ${id} = () => '${id}'`;
				}
				continue;
			}

			file += `\n\n${compiledMessage.code}`;
		}

		output[filename] = file;
	}
	return output;
}
