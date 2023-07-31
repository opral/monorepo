import { Result, tryCatch } from "@inlang/result"
import { Plugin, pluginIdRegex } from "./api.js"
import {
	PluginUsesReservedNamespaceException,
	PluginUsesInvalidApiException,
	PluginInvalidIdException,
	PluginException,
} from "./exceptions.js"

type ParsePluginResult = {
	data: {
		plugin: Plugin
	}
	errors: PluginException[]
}

/**
 * Plugin ids that should be excluded by namespace reserving.
 */
const whitelistedPlugins = ["inlang.plugin-json", "inlang.plugin-i18next"]

/**
 * Parses a plugin and returns the result.
 *
 * @description Checks for invalid ids and other errors within a plugin.
 */
export const parsePlugin = (args: { maybeValidPlugin: Plugin }): ParsePluginResult => {
	const result: ParsePluginResult = {
		data: {
			plugin: args.maybeValidPlugin,
		},
		errors: [],
	}

	/**
	 * -------------- BEGIN VALIDATION --------------
	 */

	// -- INVALID ID in META --
	if (new RegExp(pluginIdRegex).test(args.maybeValidPlugin.meta.id) === false) {
		result.errors.push(
			new PluginInvalidIdException(
				`Plugin ${args.maybeValidPlugin.meta.id} has an invalid id "${args.maybeValidPlugin.meta.id}". It must be kebap-case and contain a namespace like project.my-plugin.`,
				{ module: args.maybeValidPlugin.meta.id },
			),
		)
	}

	// -- USES RESERVED NAMESPACE --
	if (
		args.maybeValidPlugin.meta.id.includes("inlang") &&
		!whitelistedPlugins.includes(args.maybeValidPlugin.meta.id)
	) {
		result.errors.push(
			new PluginUsesReservedNamespaceException(
				`Plugin ${args.maybeValidPlugin.meta.id} uses reserved namespace 'inlang'.`,
				{
					module: args.maybeValidPlugin.meta.id,
				},
			),
		)
	}

	// -- USES UNAVAILABLE API / WILDCARD --
	const parsed = tryCatch(() => Plugin.parse(args.maybeValidPlugin))

	if (parsed.error) {
		result.errors.push(
			new PluginUsesInvalidApiException(
				`Plugin ${args.maybeValidPlugin.meta.id} uses invalid API.`,
				{ module: args.maybeValidPlugin.meta.id, cause: parsed.error as Error },
			),
		)
	}

	return result
}
