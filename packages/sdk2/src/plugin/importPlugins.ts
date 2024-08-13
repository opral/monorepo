import type { ProjectSettings } from "../schema/settings.js";
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
	mockPlugins?: Record<string, InlangPlugin>;
	preprocessPluginBeforeImport?: PreprocessPluginBeforeImportFunction;
}): Promise<{
	plugins: InlangPlugin[];
	errors: PluginError[];
}> {
	const plugins: InlangPlugin[] = [];
	const errors: PluginError[] = [];
	for (const uri of args.settings.modules ?? []) {
		const mockPlugin = args.mockPlugins?.[uri];
		if (mockPlugin) {
			plugins.push(mockPlugin);
			continue;
		}
		try {
			const moduleAsText = await fetchModuleWithCache(uri);
			const preprocessed =
				(await args.preprocessPluginBeforeImport?.(moduleAsText)) ??
				moduleAsText;
			const moduleWithMimeType =
				"data:application/javascript," + encodeURIComponent(preprocessed);
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
	console.warn("fetchWithCache is not implemented");
	const response = await fetch(uri);
	if (!response.ok) {
		throw new Error(
			`Failed to fetch the plugin. Is the link ${uri} valid? ${response.statusText}`
		);
	}
	return await response.text();
}
