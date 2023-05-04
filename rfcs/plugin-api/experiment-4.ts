/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { InlangConfig } from "@inlang/core/src/config"
import { InlangEnvironment } from "@inlang/core/src/environment/types"

export const myPlugin = createPlugin<{ pathPattern: string }>(({ settings, env }) => {
	return {
		id: "samuelstroschein.plugin-json",
		config: () => {
			if (settings.pathPattern === undefined) {
				throw new Error("pathPattern is required")
			}
			return {
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
type PluginSettingsFunction<PluginSettings> = (
	settings: PluginSettings,
) => (env: InlangEnvironment) => Plugin

type Plugin = {
	id: string
	config(): MaybePromise<Partial<InlangConfig>>
}

function createPlugin<PluginConfig>(
	callback: (args: { settings: PluginConfig; env: InlangEnvironment }) => Plugin,
): PluginSettingsFunction<PluginConfig> {
	return (settings) => (env) => callback({ settings, env })
}

function readResources(args: any): any {}

function getLanguages(args: any): any {}

// usage
myPlugin({ pathPattern: "" })({} as InlangEnvironment).config()

type MaybePromise<T> = Promise<T> | T
