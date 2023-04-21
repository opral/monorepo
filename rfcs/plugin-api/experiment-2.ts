import { Config, EnvironmentFunctions } from "@inlang/core/src/config"

export const myPlugin = createPlugin(({ pluginConfig, env }) => {
	return {
		id: "samuelstroschein.plugin-json",
		defineConfig: (config) => {
			if (pluginConfig.pathPattern === undefined) {
				throw new Error("pathPattern is required")
			}
			config.readResources = readResources({ pluginConfig, env })
			config.languages = getLanguages({ pluginConfig, env })
		},
	}
})

function createPlugin() {}

type PluginConfigFunction<PluginConfig> = (
	pluginConfig: PluginConfig,
) => PluginSetupFunction<PluginConfig>

type PluginSetupFunction<T> = (args: {
	pluginConfig: T
	env: EnvironmentFunctions
}) => Promise<Plugin>

type Plugin = {
	id: string
	defineConfig(config: Config): Config
}
