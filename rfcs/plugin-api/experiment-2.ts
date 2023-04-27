/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Config, EnvironmentFunctions } from "@inlang/core/src/config"

export const myPlugin = createPlugin<{ pathPattern: string }>(({ pluginConfig, env }) => {
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

/**
 * The function to configure a plugin.
 *
 * @example
 *   plugins: [
 * 	 	myPlugin({
 * 	   	pathPattern: "hello",
 * 	 	})
 *   ]
 */
type PluginConfigFunction<PluginConfig> = (
	pluginConfig: PluginConfig,
) => (env: EnvironmentFunctions) => Plugin

type Plugin = {
	id: string
	defineConfig(config: Partial<Config>): void
}

function createPlugin<PluginConfig>(
	callback: (args: { pluginConfig: PluginConfig; env: EnvironmentFunctions }) => Plugin,
): PluginConfigFunction<PluginConfig> {
	return (pluginConfig) => (env) => callback({ pluginConfig, env })
}

function readResources(args: any): any { }

function getLanguages(args: any): any { }

// usage
myPlugin({ pathPattern: '' })({} as EnvironmentFunctions).defineConfig({})
