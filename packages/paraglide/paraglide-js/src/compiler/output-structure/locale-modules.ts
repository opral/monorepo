import type { ProjectSettings } from "@inlang/sdk";
import type { CompiledBundleWithMessages } from "../compile-bundle.js";
import { createRuntimeFile } from "../runtime/create-runtime.js";
import { createRegistry } from "../registry.js";
import type { CompilerOptions } from "../compiler-options.js";
import { toSafeModuleId } from "../safe-module-id.js";
import { createServerFile } from "../server/create-server-file.js";

export function generateLocaleModules(
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
	const indexFile = [
		`import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from "../runtime.js"`,
		settings.locales
			.map(
				(locale) =>
					`import * as ${toSafeModuleId(locale)} from "./${locale}.js"`
			)
			.join("\n"),
		compiledBundles.map(({ bundle }) => bundle.code).join("\n"),
	].join("\n");

	const output: Record<string, string> = {
		["runtime.js"]: createRuntimeFile({
			baseLocale: settings.baseLocale,
			locales: settings.locales,
			compilerOptions,
		}),
		["server.js"]: createServerFile({ compiledBundles, compilerOptions }),
		["registry.js"]: createRegistry(),
		["messages/_index.js"]: indexFile,
		["messages.js"]: [
			"export * from './messages/_index.js'",
			"// enabling auto-import by exposing all messages as m",
			"export * as m from './messages/_index.js'",
		].join("\n"),
	};

	// generate message files
	for (const locale of settings.locales) {
		const filename = `messages/${locale}.js`;
		let file = "";

		for (const compiledBundle of compiledBundles) {
			const compiledMessage = compiledBundle.messages[locale];
			const bundleModuleId = toSafeModuleId(compiledBundle.bundle.node.id);
			const bundleId = compiledBundle.bundle.node.id;
			if (!compiledMessage) {
				const fallbackLocale = fallbackMap[locale];
				if (fallbackLocale) {
					// use the fall back locale e.g. render the message in English if the German message is missing
					file += `\nexport { ${bundleModuleId} } from "./${fallbackLocale}.js"`;
				} else {
					// no fallback exists, render the bundleId
					file += `\n/** @type {(inputs?: Record<string, never>) => string} */\nexport const ${bundleModuleId} = () => '${bundleId}'`;
				}
				continue;
			}

			file += `\n\n${compiledMessage.code}`;
		}

		// add import if used
		if (file.includes("registry.")) {
			file = `import * as registry from "../registry.js"\n` + file;
		}

		output[filename] = file;
	}
	return output;
}
