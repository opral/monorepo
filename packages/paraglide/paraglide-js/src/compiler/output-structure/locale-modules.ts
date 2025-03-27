import type { ProjectSettings } from "@inlang/sdk";
import type { CompiledBundleWithMessages } from "../compile-bundle.js";
import { toSafeModuleId } from "../safe-module-id.js";
import { inputsType } from "../jsdoc-types.js";

// Helper function to escape special characters in a string for use in a regular expression
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// This map will be used to track which bundle IDs have been renamed to which unique IDs
// It will be populated during the generateOutput function and used in messageReferenceExpression
const bundleIdToUniqueIdMap = new Map<string, string>();

export function messageReferenceExpression(locale: string, bundleId: string) {
	// First convert to safe module ID
	const safeModuleId = toSafeModuleId(bundleId);
	
	// Check if this bundleId has been mapped to a unique identifier
	const uniqueId = bundleIdToUniqueIdMap.get(bundleId);
	if (uniqueId) {
		return `${toSafeModuleId(locale)}.${uniqueId}`;
	}
	
	// Otherwise, return the default safe module ID
	return `${toSafeModuleId(locale)}.${safeModuleId}`;
}

export function generateOutput(
	compiledBundles: CompiledBundleWithMessages[],
	settings: Pick<ProjectSettings, "locales" | "baseLocale">,
	fallbackMap: Record<string, string | undefined>
): Record<string, string> {
	// Create a map to track module IDs in the index file to avoid duplicates
	const indexModuleIdMap = new Map<string, string>();
	
	// Process the bundles to ensure no duplicate bundle IDs
	// Generate unique moduleIds for duplicate IDs
	const processedBundleCodes = compiledBundles.map(({ bundle }) => {
		const bundleId = bundle.node.id;
		const bundleModuleId = toSafeModuleId(bundleId);
		
		// Check if this safe module ID has been used before
		if (indexModuleIdMap.has(bundleModuleId)) {
			// Create a unique identifier by adding a counter
			let counter = 1;
			let uniqueModuleId = `${bundleModuleId}${counter}`;
			
			while (indexModuleIdMap.has(uniqueModuleId)) {
				counter++;
				uniqueModuleId = `${bundleModuleId}${counter}`;
			}
			
			// Modify the code to use the unique identifier
			const modifiedCode = bundle.code.replace(
				new RegExp(`const ${bundleModuleId} =`, 'g'),
				`const ${uniqueModuleId} =`
			).replace(
				new RegExp(`export const ${bundleModuleId} =`, 'g'),
				`export const ${uniqueModuleId} =`
			).replace(
				new RegExp(`export { ${bundleModuleId}`, 'g'),
				`export { ${uniqueModuleId}`
			).replace(
				// Also update the trackMessageCall to use the new identifier
				new RegExp(`trackMessageCall\\("${escapeRegExp(bundleId)}"`, 'g'),
				`trackMessageCall("${bundleId}"`
			);
			
			// Store the unique ID mapping
			indexModuleIdMap.set(uniqueModuleId, bundleId);
			
			// Also store in the global map for messageReferenceExpression to use
			bundleIdToUniqueIdMap.set(bundleId, uniqueModuleId);
			
			return modifiedCode;
		}
		
		// Store the mapping
		indexModuleIdMap.set(bundleModuleId, bundleId);
		
		return bundle.code;
	}).join("\n");
	
	const indexFile = [
		`import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer } from "../runtime.js"`,
		settings.locales
			.map(
				(locale) =>
					`import * as ${toSafeModuleId(locale)} from "./${locale}.js"`
			)
			.join("\n"),
		processedBundleCodes,
	].join("\n");

	const output: Record<string, string> = {
		["messages/_index.js"]: indexFile,
	};

	// generate message files
	for (const locale of settings.locales) {
		const filename = `messages/${locale}.js`;
		let file = "";
		
		// Keep track of module IDs to avoid duplicates
		const moduleIdMap = new Map<string, string>();

		for (const compiledBundle of compiledBundles) {
			const compiledMessage = compiledBundle.messages[locale];
			const bundleId = compiledBundle.bundle.node.id;
			const bundleModuleId = toSafeModuleId(compiledBundle.bundle.node.id);
			
			// Check if this module ID has already been used
			let uniqueModuleId = bundleModuleId;
			if (moduleIdMap.has(bundleModuleId)) {
				// If it has, create a unique ID by adding an index
				let counter = 1;
				uniqueModuleId = `${bundleModuleId}${counter}`;
				while (moduleIdMap.has(uniqueModuleId)) {
					counter++;
					uniqueModuleId = `${bundleModuleId}${counter}`;
				}
			}
			
			// Store this module ID
			moduleIdMap.set(uniqueModuleId, bundleId);
			
			const inputs =
				compiledBundle.bundle.node.declarations?.filter(
					(decl) => decl.type === "input-variable"
				) ?? [];
			if (!compiledMessage) {
				const fallbackLocale = fallbackMap[locale];
				if (fallbackLocale) {
					// use the fall back locale e.g. render the message in English if the German message is missing
					file += `\nexport { ${uniqueModuleId} } from "./${fallbackLocale}.js"`;
				} else {
					// no fallback exists, render the bundleId
					file += `\n/** @type {(inputs: ${inputsType(inputs)}) => string} */\nexport const ${uniqueModuleId} = () => '${bundleId}'`;
				}
				continue;
			}

			file += `\n\nexport const ${uniqueModuleId} = ${compiledMessage.code}`;
		}

		// add import if used
		if (file.includes("registry.")) {
			file = `import * as registry from "../registry.js"\n` + file;
		}

		output[filename] = file;
	}
	return output;
}