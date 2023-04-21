/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import type { EnvironmentFunctions, Config } from "@inlang/core/src/config/index.js"

export const myPlugin: PluginConfigFunction<{ pathPattern: string }> = ({ pluginConfig, env }) => {
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
}

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

function readResources(args: any) {}

function getLanguages(args: any) {}
