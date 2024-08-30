import type { ProjectSettings } from "../json-schema/settings.js";
import { PluginError, PluginImportError } from "./errors.js";
import type { InlangPlugin } from "./schema.js";

/**
 * Function that preprocesses the plugin before importing it.
 *
 * - used by sherlock to convert ESM to CJS
 */
export type PreprocessPluginBeforeImportFunction = (
	moduleText: string
) => Promise<string> | string;

export async function importPlugins(args: {
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
			let moduleAsText = await fetchModuleWithCache(uri);
			if (args.preprocessPluginBeforeImport) {
				moduleAsText = await args.preprocessPluginBeforeImport(moduleAsText);
			}
			const moduleWithMimeType =
				"data:application/javascript," + encodeURIComponent(moduleAsText);
			const { default: plugin } = await import(
				/* @vite-ignore */ moduleWithMimeType
			);
			plugins.push(plugin);
		} catch (e) {
			errors.push(new PluginImportError({ plugin: uri, cause: e as Error }));
		}
	}
	return { plugins, errors };
}

async function fetchModuleWithCache(uri: string): Promise<string> {
	const response = await fetch(uri);
	if (!response.ok) {
		throw new Error(
			`Failed to fetch the plugin. Is the link ${uri} valid? ${response.statusText}`
		);
	}
	return await response.text();
}
