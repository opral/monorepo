import type { ProjectSettings } from "@inlang/sdk";
import type { CompiledBundleWithMessages } from "../compile-bundle.js";
import { toSafeModuleId } from "../safe-module-id.js";
import { inputsType } from "../jsdoc-types.js";

export function messageReferenceExpression(locale: string, bundleId: string) {
	return `${toSafeModuleId(locale)}.${toSafeModuleId(bundleId)}`;
}

export function generateOutput(
	compiledBundles: CompiledBundleWithMessages[],
	settings: Pick<ProjectSettings, "locales" | "baseLocale">,
	fallbackMap: Record<string, string | undefined>
): Record<string, string> {
	const indexFile = [
		`import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from "../runtime.js"`,
		`/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */`,
		settings.locales
			.map(
				(locale) =>
					`import * as ${toSafeModuleId(locale)} from "./${locale}.js"`
			)
			.join("\n"),
		compiledBundles.map(({ bundle }) => bundle.code).join("\n"),
	].join("\n");

	const output: Record<string, string> = {
		["messages/_index.js"]: indexFile,
	};

	// generate message files
	for (const locale of settings.locales) {
		const filename = `messages/${locale}.js`;
		let file = "";

		for (const compiledBundle of compiledBundles) {
			const compiledMessage = compiledBundle.messages[locale];
			const bundleModuleId = toSafeModuleId(compiledBundle.bundle.node.id);
			const bundleId = compiledBundle.bundle.node.id;
			const inputs =
				compiledBundle.bundle.node.declarations?.filter(
					(decl) => decl.type === "input-variable"
				) ?? [];
			if (!compiledMessage) {
				const fallbackLocale = fallbackMap[locale];
				if (fallbackLocale) {
					// use the fall back locale e.g. render the message in English if the German message is missing
					file += `\nexport { ${bundleModuleId} } from "./${fallbackLocale}.js"`;
				} else {
					// no fallback exists, render the bundleId
					file += `\n/** @type {(inputs: ${inputsType(inputs)}) => LocalizedString} */\nexport const ${bundleModuleId} = () => /** @type {LocalizedString} */ ('${bundleId}')`;
				}
				continue;
			}

			file += `\n\nexport const ${bundleModuleId} = ${compiledMessage.code}`;
		}

		// add import if used
		if (file.includes("registry.")) {
			file = `import * as registry from "../registry.js"\n` + file;
		}

		// add LocalizedString typedef reference if used
		if (file.includes("LocalizedString")) {
			file =
				`/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */\n` +
				file;
		}

		output[filename] = file;
	}
	return output;
}
