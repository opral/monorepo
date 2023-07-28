import type { InlangConfig } from "@inlang/config"
import { tryCatch } from "@inlang/result"
import { PluginApi, pluginIdRegex } from "./api.js"
import {
	PluginIncorrectlyDefinedUsedApisError,
	PluginUsesReservedNamespaceError,
	PluginUsesUnavailableApiError,
	PluginInvalidIdError,
	PluginApiAlreadyDefinedError,
	PluginFunctionLoadMessagesAlreadyDefinedError,
	PluginFunctionSaveMessagesAlreadyDefinedError,
} from "./errors.js"
import type { ResolvePluginResult } from "./resolvePlugins.js"

/**
 * Plugin ids that should be excluded by namespace reserving.
 */
const whitelistedPlugins = [
	"inlang.plugin-json",
	"inlang.plugin-standard-lint-rules",
	"inlang.plugin-i18next",
]

export const parsePlugin = (args: {
	config: InlangConfig
	plugin: PluginApi
	pluginInConfig: InlangConfig["plugins"][0]
	result: ResolvePluginResult
}) => {
	const api = args.plugin.setup({ config: args.config, options: args.pluginInConfig.options })

	// console.log(args.plugin, args.result.data)
	/**
	 * -------------- BEGIN VALIDATION --------------
	 */

	// -- INVALID ID in META --
	if (new RegExp(pluginIdRegex).test(args.plugin.meta.id) === false) {
		throw new PluginInvalidIdError(
			`Plugin ${args.pluginInConfig.module} has an invalid id ${args.plugin.meta.id}. It must be kebap-case and contain a namespace like project.my-plugin.`,
			{ module: args.pluginInConfig.module },
		)
	}

	// -- USES RESERVED NAMESPACE --
	if (args.plugin.meta.id.includes("inlang") && !whitelistedPlugins.includes(args.plugin.meta.id)) {
		throw new PluginUsesReservedNamespaceError("Plugin uses reserved namespace 'inlang'.", {
			module: args.pluginInConfig.module,
		})
	}

	// -- MULTIPLE PLUGINS DEFINE LOADMESSAGES --
	if (args.plugin.meta.usedApis.includes("loadMessages")) {
		if (args.result.data.loadMessages !== undefined) {
			throw new PluginFunctionLoadMessagesAlreadyDefinedError(
				`Plugin ${args.pluginInConfig.module} defines loadMessages but another plugin already defined it.`,
				{ module: args.pluginInConfig.module },
			)
		}
	}

	// -- MULTIPLE PLUGINS DEFINE SAVEMESSAGES --
	if (args.plugin.meta.usedApis.includes("saveMessages")) {
		if (args.result.data.saveMessages !== undefined) {
			throw new PluginFunctionSaveMessagesAlreadyDefinedError(
				`Plugin ${args.pluginInConfig.module} defines saveMessages but another plugin already defined it.`,
				{ module: args.pluginInConfig.module },
			)
		}
	}

	for (const returnedApi of Object.keys(api)) {
		// -- ALREADY DEFINED API --
		if (args.result.data[returnedApi as keyof typeof args.result.data] !== undefined) {
			throw new PluginApiAlreadyDefinedError(
				`Plugin ${args.pluginInConfig.module} defines a property ${returnedApi} that is already defined by another plugin.`,
				{ module: args.pluginInConfig.module },
			)
		}
		// -- DOES NOT USE DEFINED API --
		if (!args.plugin.meta.usedApis.includes(returnedApi as keyof typeof api)) {
			throw new PluginIncorrectlyDefinedUsedApisError(
				`Plugin ${args.pluginInConfig.module} defines api ${returnedApi} but doesn't use it.`,
				{ module: args.pluginInConfig.module },
			)
		}

		// -- DOES NOT DEFINE USED API --
		if (args.plugin.meta.usedApis.includes(returnedApi as keyof typeof api)) {
			continue
		} else {
			throw new PluginIncorrectlyDefinedUsedApisError(
				`Plugin ${args.pluginInConfig.module} uses api ${returnedApi} but doesn't define it in meta.usedApis.`,
				{ module: args.pluginInConfig.module },
			)
		}
	}

	// -- USES UNAVAILABLE API / WILDCARD --
	const parsed = tryCatch(() => PluginApi.parse(args.plugin))
	if (parsed.error) {
		throw new PluginUsesUnavailableApiError(
			`Plugin ${args.pluginInConfig.module} uses unavailable api.`,
			{ module: args.pluginInConfig.module },
		)
	}
}
