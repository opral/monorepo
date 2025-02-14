import type { Lix } from "@lix-js/sdk";
import type { ProjectSettings } from "../json-schema/settings.js";
import { PluginError, PluginImportError } from "./errors.js";
import type { InlangPlugin } from "./schema.js";
import { withCache } from "./cache.js";

/**
 * Function that preprocesses the plugin before importing it.
 *
 * - used by sherlock to convert ESM to CJS
 */
export type PreprocessPluginBeforeImportFunction = (
	moduleText: string
) => Promise<string> | string;

export async function importPlugins(args: {
	lix: Lix;
	settings: ProjectSettings;
	preprocessPluginBeforeImport?: PreprocessPluginBeforeImportFunction;
}): Promise<{
	plugins: InlangPlugin[];
	errors: PluginError[];
}> {
	const plugins: InlangPlugin[] = [];
	const errors: PluginError[] = [];
	for (const uri of args.settings.modules ?? []) {
		try {
			let moduleAsText = await withCache(fetchPlugin, args.lix)(uri);
			if (args.preprocessPluginBeforeImport) {
				moduleAsText = await args.preprocessPluginBeforeImport(moduleAsText);
			}
			let moduleAsURL;
			if (process.versions.bun) {
				// In bun we need to do dynamic imports differently
				moduleAsURL = URL.createObjectURL(
					new Blob([moduleAsText], { type: "text/javascript" })
				);
			} else {
				// node and others
				moduleAsURL = "data:text/javascript;base64," + btoa(moduleAsText);
			}
			const { default: module } = await import(/* @vite-ignore */ moduleAsURL);
			// old legacy message lint rules are not supported
			// and ingored for backwards compatibility
			if (module.id?.includes("messageLintRule")) {
				continue;
			}
			plugins.push(module);
		} catch (e) {
			errors.push(new PluginImportError({ plugin: uri, cause: e as Error }));
		}
	}
	return { plugins, errors };
}

async function fetchPlugin(uri: string): Promise<string> {
	try {
		const response = await fetch(uri);
		return await response.text();
	} catch (error) {
		throw new PluginImportError({
			plugin: uri,
			cause: error as Error,
		});
	}
}
