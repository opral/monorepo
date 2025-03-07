import type { ProjectSettings } from "@inlang/sdk";
import type { CompiledBundleWithMessages } from "../compile-bundle.js";
import { createRuntimeFile } from "../runtime/create-runtime.js";
import { createRegistry } from "../registry.js";
import { escapeForSingleQuoteString } from "../../services/codegen/escape.js";
import type { CompilerOptions } from "../compiler-options.js";
import { toSafeModuleId } from "../safe-module-id.js";
import { createServerFile } from "../server/create-server-file.js";

export function generateMessageModules(
	compiledBundles: CompiledBundleWithMessages[],
	settings: Pick<ProjectSettings, "locales" | "baseLocale">,
	fallbackMap: Record<string, string | undefined>,
	compilerOptions: {
		strategy: NonNullable<CompilerOptions["strategy"]>;
		cookieName: NonNullable<CompilerOptions["cookieName"]>;
		isServer: NonNullable<CompilerOptions["isServer"]>;
		localStorageKey: NonNullable<CompilerOptions["localStorageKey"]>;
		experimentalMiddlewareLocaleSplitting: NonNullable<
			CompilerOptions["experimentalMiddlewareLocaleSplitting"]
		>;
	}
): Record<string, string> {
	const output: Record<string, string> = {
		["runtime.js"]: createRuntimeFile({
			baseLocale: settings.baseLocale,
			locales: settings.locales,
			compilerOptions,
		}),
		["server.js"]: createServerFile({ compiledBundles, compilerOptions }),
		["registry.js"]: createRegistry(),
	};

	// all messages index file
	output["messages/_index.js"] = [
		...compiledBundles.map(
			({ bundle }) =>
				`export * from './${toSafeModuleId(bundle.node.id)}/index.js'`
		),
	].join("\n");

	output["messages.js"] = [
		"export * from './messages/_index.js'",
		"// enabling auto-import by exposing all messages as m",
		"export * as m from './messages/_index.js'",
	].join("\n");

	for (const compiledBundle of compiledBundles) {
		const bundleFileId = toSafeModuleId(compiledBundle.bundle.node.id);
		// bundle file
		const indexFilename = `messages/${bundleFileId}/index.js`;
		if (output[indexFilename]) {
			// bundle file already exists, need to append to it
			output[indexFilename] += `\n${compiledBundle.bundle.code}`;
		} else {
			// create fresh bundle file
			const code = [
				settings.locales
					.map(
						(locale) =>
							`import * as ${toSafeModuleId(locale)} from "./${locale}.js"`
					)
					.join("\n"),
				`import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from '../../runtime.js'`,
				"",
				compiledBundle.bundle.code,
			].join("\n");
			output[indexFilename] = code;
		}

		// message files
		for (const locale of settings.locales) {
			let file = "";

			const compiledMessage = compiledBundle.messages[locale];
			const id = toSafeModuleId(compiledBundle.bundle.node.id);
			if (!compiledMessage) {
				// add fallback
				const fallbackLocale = fallbackMap[locale];
				if (fallbackLocale) {
					// take the fallback locale
					file += `\nexport { ${id} } from "./${fallbackLocale}.js"`;
				} else {
					// fallback to just the bundle id
					file += `\n/** @type {(inputs?: Record<string, never>) => string} */\nexport const ${id} = () => '${escapeForSingleQuoteString(
						compiledBundle.bundle.node.id
					)}'`;
				}
			} else {
				file += `\n${compiledMessage.code}`;
			}

			if (output[`messages/${bundleFileId}/${locale}.js`]) {
				// message file already exists, need to append to it
				output[`messages/${bundleFileId}/${locale}.js`] += file;
			} else {
				// Add the registry import to the message file
				// if registry is used
				if (file.includes("registry.")) {
					file = `import * as registry from '../../registry.js'\n` + file;
				}

				output[`messages/${bundleFileId}/${locale}.js`] = file;
			}
		}
	}
	return output;
}
