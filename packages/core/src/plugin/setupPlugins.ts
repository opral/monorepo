import type { Config, EnvironmentFunctions } from "../config/schema.js"
import type { Plugin, PluginSetupFunction } from "./types.js"
import { PluginSetupError } from "./errors/PluginSetupError.js"
import { deepmergeInto } from "deepmerge-ts"

export type ConfigWithSetupPlugins = Omit<Partial<Config>, "plugins"> & {
	plugins: Plugin[]
}

/**
 * Setup the plugins and process the config callback.
 *
 * The function mutates the config object. Mutating the config object
 * is expected to:
 *
 * 	1. decrease the initial startup time of inlang apps with 10+ plugins
 *     (immutability is expensive).
 * 	2. leads to a lightly better API for `setupConfig`.
 *  3. plugins configs are only merged
 *
 * We can change this behaviour
 * if required as this function is only used internally.
 *
 */
export async function setupPlugins(args: {
	config: Partial<Config>
	env: EnvironmentFunctions
}): Promise<ConfigWithSetupPlugins> {
	if (args.config.plugins === undefined) {
		args.config.plugins = []
		return args.config as ConfigWithSetupPlugins
	}
	for (let i = 0; i < args.config.plugins.length; i++) {
		const plugin = args.config.plugins[i] as Plugin | PluginSetupFunction
		try {
			// If a plugin uses a setup function, the setup function needs to be invoked.
			if (typeof plugin === "function") {
				args.config.plugins[i] = plugin(args.env)
			}
			const config = await (plugin as Plugin).config()
			deepmergeInto(args.config, config)
		} catch (error) {
			console.error(
				new PluginSetupError(`Failed to setup plugin '${(plugin as Plugin).id}'`, { cause: error }),
			)
		}
	}
	// remove duplicates from languages
	args.config.languages = [...new Set(args.config.languages)]
	return args.config as ConfigWithSetupPlugins
}
