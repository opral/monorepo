import type { ProjectSettings } from "@inlang/sdk";
import type { CompiledBundleWithMessages } from "../compile-bundle.js";
import { createRuntime } from "../runtime/create-runtime.js";
import { createRegistry } from "../registry.js";
import { jsIdentifier } from "../../services/codegen/identifier.js";
import { escapeForSingleQuoteString } from "../../services/codegen/escape.js";

export function generateMessageModules(
	compiledBundles: CompiledBundleWithMessages[],
	settings: Pick<ProjectSettings, "locales" | "baseLocale">,
	fallbackMap: Record<string, string | undefined>,
	emitTs: boolean,
	useTsImports: boolean
): Record<string, string> {
	const fileExt = emitTs ? "ts" : "js";
	const importExt = useTsImports ? "ts" : "js";

	const output: Record<string, string> = {
		["runtime." + fileExt]: createRuntime(settings, emitTs),
		["registry." + fileExt]: createRegistry(emitTs),
	};

	// messages index file
	output["messages." + fileExt] = [
		"/* eslint-disable */",
		...compiledBundles.map(
			({ bundle }) =>
				`export * from './messages/${bundle.node.id}/index.${importExt}'`
		),
	].join("\n");

	// Creates a per message index file
	for (const compiledBundle of compiledBundles) {
		const filename = `messages/${compiledBundle.bundle.node.id}/index.${fileExt}`;
		const code = [
			"/* eslint-disable */",
			`import * as registry from '../../registry.${importExt}'`,
			settings.locales
				.map(
					(locale) =>
						`import * as ${jsIdentifier(locale)} from "./${locale}.${importExt}"`
				)
				.join("\n"),
			`import { getLocale } from '../../runtime.${importExt}'`,
			"",
			compiledBundle.bundle.code,
		].join("\n");
		output[filename] = code;
	}

	for (const locale of settings.locales) {
		for (const compiledBundle of compiledBundles) {
			let file = [
				"/* eslint-disable */",
				`import * as registry from '../../registry.${importExt}'`,
			].join("\n");

			const compiledMessage = compiledBundle.messages[locale];
			const id = jsIdentifier(compiledBundle.bundle.node.id);
			if (!compiledMessage) {
				// add fallback
				const fallbackLocale = fallbackMap[locale];
				if (fallbackLocale) {
					// take the fallback locale
					file += `\nexport { ${id} } from "./${fallbackLocale}.${importExt}"`;
				} else {
					// fallback to just the bundle id
					file += `\nexport const ${id} = () => '${escapeForSingleQuoteString(
						compiledBundle.bundle.node.id
					)}'`;
				}
			} else {
				file += `\n${compiledMessage.code}`;
			}

			output[`messages/${compiledBundle.bundle.node.id}/${locale}.${fileExt}`] =
				file;
		}
	}
	return output;
}
