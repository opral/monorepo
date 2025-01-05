import type { ProjectSettings } from "@inlang/sdk";
import type { CompiledBundleWithMessages } from "../compileBundle.js";
import { createRuntime } from "../runtime.js";
import { createRegistry } from "../registry.js";
import { jsIdentifier } from "../../services/codegen/identifier.js";
import { escapeForSingleQuoteString } from "../../services/codegen/escape.js";

export function generateMessageModules(
	resources: CompiledBundleWithMessages[],
	settings: Pick<ProjectSettings, "locales" | "baseLocale">,
	fallbackMap: Record<string, string | undefined>
): Record<string, string> {
	const output: Record<string, string> = {
		"runtime.js": createRuntime(settings),
		"registry.js": createRegistry(),
	};

	// index messages
	output["messages.js"] = [
		"/* eslint-disable */",
		...resources.map(
			({ bundle }) => `export * from './messages/index/${bundle.node.id}.js'`
		),
	].join("\n");

	for (const resource of resources) {
		const filename = `messages/index/${resource.bundle.node.id}.js`;
		const code = [
			"/* eslint-disable */",
			"import * as registry from '../../registry.js'",
			settings.locales
				.map(
					(locale) =>
						`import * as ${jsIdentifier(locale)} from "../${locale}.js"`
				)
				.join("\n"),
			"import { getLocale } from '../../runtime.js'",
			"",
			resource.bundle.code,
		].join("\n");
		output[filename] = code;
	}

	// generate locales
	for (const locale of settings.locales) {
		const messageIndexFile = [
			"/* eslint-disable */",
			...resources.map(
				({ bundle }) => `export * from './${locale}/${bundle.node.id}.js'`
			),
		].join("\n");
		output[`messages/${locale}.js`] = messageIndexFile;

		// generate individual message files
		for (const resource of resources) {
			let file = [
				"/* eslint-disable */",
				"import * as registry from '../../registry.js' ",
			].join("\n");

			const compiledMessage = resource.messages[locale];
			const id = jsIdentifier(resource.bundle.node.id);
			if (!compiledMessage) {
				// add fallback
				const fallbackLocale = fallbackMap[locale];
				if (fallbackLocale) {
					file += `\nexport { ${id} } from "../${fallbackLocale}.js"`;
				} else {
					file += `\nexport const ${id} = () => '${escapeForSingleQuoteString(
						resource.bundle.node.id
					)}'`;
				}
			} else {
				file += `\n${compiledMessage.code}`;
			}

			output[`messages/${locale}/${resource.bundle.node.id}.js`] = file;
		}
	}
	return output;
}
