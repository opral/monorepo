import type { ProjectSettings } from "@inlang/sdk";
import type { CompiledBundleWithMessages } from "../compile-bundle.js";
import { createRuntimeFile } from "../runtime/create-runtime.js";
import { createRegistry } from "../registry.js";
import { jsIdentifier } from "../../services/codegen/identifier.js";
import { escapeForSingleQuoteString } from "../../services/codegen/escape.js";
import type { CompilerOptions } from "../compile.js";

export function generateMessageModules(
	compiledBundles: CompiledBundleWithMessages[],
	settings: Pick<ProjectSettings, "locales" | "baseLocale">,
	fallbackMap: Record<string, string | undefined>,
	compilerOptions: {
		strategy: NonNullable<CompilerOptions["strategy"]>;
		cookieName: NonNullable<CompilerOptions["cookieName"]>;
		pathnamePrefixDefaultLocale: NonNullable<
			CompilerOptions["pathnamePrefixDefaultLocale"]
		>;
	}
): Record<string, string> {
	const output: Record<string, string> = {
		["runtime.js"]: createRuntimeFile({
			baseLocale: settings.baseLocale,
			locales: settings.locales,
			compilerOptions,
		}),
		["registry.js"]: createRegistry(),
	};

	// messages index file
	output["messages.js"] = [
		...compiledBundles.map(
			({ bundle }) => `export * from './messages/${bundle.node.id}/index.js'`
		),
	].join("\n");

	// Creates a per message index file
	for (const compiledBundle of compiledBundles) {
		const filename = `messages/${compiledBundle.bundle.node.id}/index.js`;
		const code = [
			settings.locales
				.map(
					(locale) =>
						`import * as ${jsIdentifier(locale)} from "./${locale}.js"`
				)
				.join("\n"),
			`import { getLocale } from '../../runtime.js'`,
			"",
			compiledBundle.bundle.code,
		].join("\n");
		output[filename] = code;
	}

	for (const locale of settings.locales) {
		for (const compiledBundle of compiledBundles) {
			let file = "";

			const compiledMessage = compiledBundle.messages[locale];
			const id = jsIdentifier(compiledBundle.bundle.node.id);
			if (!compiledMessage) {
				// add fallback
				const fallbackLocale = fallbackMap[locale];
				if (fallbackLocale) {
					// take the fallback locale
					file += `\nexport { ${id} } from "./${fallbackLocale}.js"`;
				} else {
					// fallback to just the bundle id
					file += `\nexport const ${id} = () => '${escapeForSingleQuoteString(
						compiledBundle.bundle.node.id
					)}'`;
				}
			} else {
				file += `\n${compiledMessage.code}`;
			}

			// Add the registry import to the message file
			// if registry is used
			if (file.includes("registry.")) {
				file = `import { registry } from '../../registry.js'\n` + file;
			}

			output[`messages/${compiledBundle.bundle.node.id}/${locale}.js`] = file;
		}
	}
	return output;
}
