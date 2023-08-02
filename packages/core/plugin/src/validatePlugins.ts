import type { InlangConfig } from "@inlang/config"
import type { Plugin, ResolvePluginsFunction } from "./api.js"
import {
	PluginError,
	PluginFunctionLoadMessagesAlreadyDefinedError,
	PluginFunctionSaveMessagesAlreadyDefinedError,
} from "./errors.js"

type ValidatePluginResult = {
	data: {
		plugin: Plugin
	}
	errors: PluginError[]
}

/**
 * Validates plugins after they have been resolved.
 *
 * @description Checks for duplicate APIs and other errors for resolved plugins.
 */
export const validatePlugins = (args: {
	plugins: Awaited<ReturnType<ResolvePluginsFunction>>
	plugin: Plugin
	pluginInConfig?: Exclude<Exclude<InlangConfig["settings"], undefined>["plugins"], undefined>[string]
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
			new PluginFunctionLoadMessagesAlreadyDefinedError(
				`Plugin ${args.plugin.meta.displayName} defines the loadMessages function, but it was already defined by another plugin.`,
				{ plugin: args.plugin.meta.id },
			),
		)
	}
	if (
		typeof args.plugin.saveMessages === "function" &&
		args.plugins.data.saveMessages !== undefined
	) {
		result.errors.push(
			new PluginFunctionSaveMessagesAlreadyDefinedError(
				`Plugin ${args.plugin.meta.displayName} defines the saveMessages function, but it was already defined by another plugin.`,
				{ plugin: args.plugin.meta.id },
			),
		)
	}

	return result
}
