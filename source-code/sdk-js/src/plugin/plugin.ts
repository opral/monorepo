import { SdkConfig as SdkSettings, validateSdkConfig } from './schema.js'
import type { InlangConfig } from '@inlang/core/config'
import type { InlangEnvironment } from '@inlang/core/environment'
import { createPlugin } from "@inlang/core/plugin";

// ------------------------------------------------------------------------------------------------

export const sdkPlugin = createPlugin<SdkSettings>(({ settings, env }) => ({
	id: "inlang.sdk-js",
	config: async () => {
		const parsedConfig = validateSdkConfig(settings)

		// await addDefaultResourcePluginIfMissing(config, env)
		// await addIdeExtensionPluginIfMissing(config, env)

		return {
			sdk: parsedConfig
		} as Partial<InlangConfig> // TODO: should the return type really be a partial of InlangConfig?
	},
}))

// this is currently not possible because the Plugin `config` function does not receive the existing config object
const addDefaultResourcePluginIfMissing = async (config: Partial<InlangConfig>, env: InlangEnvironment) => {
	if (config.readResources) return

	const plugin = await env.$import(
		"https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@1/dist/index.js",
	)

	const pluginConfig = {
		pathPattern: "./languages/{language}.json",
	}

	config.languages = await plugin.getLanguages({ ...env, pluginConfig })
	config.readResources = (args) => plugin.readResources({ ...args, ...env, pluginConfig })
	config.writeResources = (args) => plugin.writeResources({ ...args, ...env, pluginConfig })
}

const addIdeExtensionPluginIfMissing = async (config: Partial<InlangConfig>, env: InlangEnvironment) => {
	// TODO
}