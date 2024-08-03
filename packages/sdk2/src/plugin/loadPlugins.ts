import type { ProjectSettings } from "../schema/settings.js"
import { PluginError, PluginImportError } from "./errors.js"
import type { InlangPlugin } from "./type.js"

export async function loadPlugins(args: { settings: ProjectSettings }): Promise<{
	plugins: InlangPlugin[]
	errors: PluginError[]
}> {
	const plugins: InlangPlugin[] = []
	const errors: PluginError[] = []
	for (const uri of args.settings.modules) {
		try {
			const { default: pluginModule } = await importPlugin(uri)
			plugins.push(pluginModule)
		} catch (e) {
			errors.push(new PluginError("Couldn't import the plugin", { plugin: uri, cause: e as Error }))
		}
	}
	return { plugins, errors }
}

async function importPlugin(uri: string) {
	const response = await fetch(uri)
	if (!response.ok) {
		throw new PluginImportError({
			plugin: uri,
			cause: new Error(`Failed to fetch the plugin: ${response.statusText}`),
		})
	}

	const moduleAsText = await response.text()
	const moduleWithMimeType = "data:application/javascript," + encodeURIComponent(moduleAsText)
	try {
		return await import(/* @vite-ignore */ moduleWithMimeType)
	} catch (error) {
		throw new PluginImportError({ plugin: uri, cause: error as Error })
	}
}
