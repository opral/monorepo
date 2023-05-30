import type { InlangEnvironment } from "../environment/types.js"
import type { PluginSetupFunction, Plugin } from "./types.js"

export function createPlugin<
	PluginSettings extends Record<string, unknown> | undefined = undefined,
>(
	callback: (args: { settings: PluginSettings; env: InlangEnvironment }) => Plugin,
): PluginSettings extends undefined
	? () => PluginSetupFunction
	: (settings?: PluginSettings) => PluginSetupFunction {
	// @ts-expect-error - settings can be undefined which typescript complains about
	//  that is okay though.
	return (settings) => (env) => callback({ settings, env })
}
