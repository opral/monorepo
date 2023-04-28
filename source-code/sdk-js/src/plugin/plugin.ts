import type { Config, EnvironmentFunctions } from '@inlang/core/config'
import { SdkConfig, validateConfig } from './schema.js'
import extend from 'just-extend'
import type { ConfigWithSdk } from './config.js'

// ! non final API

type PluginConfigFunction<PluginConfig> = (
	pluginConfig: PluginConfig,
) => (env: EnvironmentFunctions) => Plugin

type Plugin = {
	id: string
	defineConfig(config: Partial<Config>): Promise<void>
}

function createPlugin<PluginConfig>(
	callback: (args: { pluginConfig: PluginConfig; env: EnvironmentFunctions }) => Plugin,
): PluginConfigFunction<PluginConfig> {
	return (pluginConfig) => (env) => callback({ pluginConfig, env })
}

// ------------------------------------------------------------------------------------------------

const defaultSdkConfig: SdkConfig = {
	languageNegotiation: {
		strict: false,
		strategies: [
			{ type: 'localStorage' },
			{ type: 'accept-language-header' },
			{ type: 'navigator' },
		],
	}
}

export const plugin = createPlugin<SdkConfig>(({ pluginConfig, env }) => {
	return {
		id: "inlang.sdk-js",
		defineConfig: async (config) => {
			validateConfig(pluginConfig);

			(config as ConfigWithSdk).sdk = extend(true, {}, defaultSdkConfig, pluginConfig) as SdkConfig

			await addDefaultResourcePluginIfMissing(config, env)
			await addIdeExtensionPluginIfMissing(config, env)
		},
	}
})

const addDefaultResourcePluginIfMissing = async (config: Partial<Config>, env: EnvironmentFunctions) => {
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

const addIdeExtensionPluginIfMissing = async (config: Partial<Config>, env: EnvironmentFunctions) => {
	// TODO
}