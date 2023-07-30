import type { InlangConfig } from "@inlang/config"
import type { Plugin, ResolvedPluginsApi } from "./api.js"
import {
	PluginException,
	PluginFunctionLoadMessagesAlreadyDefinedException,
	PluginFunctionSaveMessagesAlreadyDefinedException,
} from "./exceptions.js"
import type { ResolvePluginResult } from "./resolvePlugins.js"

type ValidatePluginResult = {
	data: {
		plugin: Plugin
	}
	errors: PluginException[]
}

/**
 * Validates plugins after they have been resolved.
 *
 * @description Checks for duplicate APIs and other errors for resolved plugins.
 */
export const validatePlugins = (args: {
	plugins: ResolvePluginResult
	plugin: Plugin
	pluginInConfig: InlangConfig["plugins"][number]
}): ValidatePluginResult => {
	const result: ValidatePluginResult = {
		data: {
			plugin: args.plugin,
		},
		errors: [],
	}
	// -- ALREADY DEFINED API --
	if (
		typeof args.plugin.loadMessages === "function" &&
		args.plugins.data.loadMessages !== undefined
	) {
		result.errors.push(
			new PluginFunctionLoadMessagesAlreadyDefinedException(
				`Plugin ${args.plugin.meta.displayName} defines the loadMessages function, but it was already defined by another plugin.`,
				{ module: args.pluginInConfig.module },
			),
		)
	}
	if (
		typeof args.plugin.saveMessages === "function" &&
		args.plugins.data.saveMessages !== undefined
	) {
		result.errors.push(
			new PluginFunctionSaveMessagesAlreadyDefinedException(
				`Plugin ${args.plugin.meta.displayName} defines the saveMessages function, but it was already defined by another plugin.`,
				{ module: args.pluginInConfig.module },
			),
		)
	}

	return result
}
