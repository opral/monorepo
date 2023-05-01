/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { InlangConfig } from "@inlang/core/src/config"
import { InlangEnvironment } from "@inlang/core/src/environment/types"

function readResources(args: any): any { }

function getLanguages(args: any): any { }

export const myPlugin = createPlugin<{ pathPattern: string }>((settings) => {
	return {
		id: "samuelstroschein.plugin-json",
		defineConfig: ({ config, env }) => {
			if (settings.pathPattern === undefined) {
				throw new Error("pathPattern is required")
			}

			return {
				...config,
				readResources: readResources({ settings, env }),
				languages: getLanguages({ settings, env }),
			}
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
type InitPluginFunction<PluginSettings> = (
	settings: PluginSettings,
) => Plugin

type Plugin = {
	id: string
	defineConfig(args: { config: Readonly<Partial<InlangConfig>>, env: InlangEnvironment }): void
}

function createPlugin<PluginSettings>(
	callback: (settings: PluginSettings) => Plugin,
): InitPluginFunction<PluginSettings> {
	return callback
}

// usage:
myPlugin({ pathPattern: '' }).defineConfig({ config: {}, env: {} as InlangEnvironment })
