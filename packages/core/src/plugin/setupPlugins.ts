import type { Config, EnvironmentFunctions } from "../config/schema.js"
import type { Plugin, PluginSetupFunction } from "./types.js"
import { deepmergeInto } from "deepmerge-ts"

export type ConfigWithSetupPlugins = Omit<Partial<Config>, "plugins"> & {
	plugins: Plugin[]
}

/**
 * Setup the plugins and process the config callback.
 *
 * The function mutates the config object. Mutating the config object
 * is expected to yield some performance benefits and leads to a
 * slightly better API for `setupConfig`. We can change this behaviour
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
		// If a plugin uses a setup function, the setup
		// function needs to be invoked.
		if (typeof args.config.plugins[i] === "function") {
			args.config.plugins[i] = (args.config.plugins[i] as PluginSetupFunction)(args.env)
		}
		const plugin = args.config.plugins[i] as Plugin
		const config = await plugin?.config()
		deepmergeInto(args.config, config)
	}
	// remove duplicates from languages
	args.config.languages = [...new Set(args.config.languages)]
	return args.config as ConfigWithSetupPlugins
}
