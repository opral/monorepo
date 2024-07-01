/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Plugin } from "@inlang/sdk"
import { displayName, description } from "../marketplace-manifest.json"
import * as pluginMessageFormat from "@inlang/plugin-message-format"
import * as mFunctionMatcher from "@inlang/plugin-m-function-matcher"

const id = "plugin.inlang.paraglideJs"

export const plugin: Plugin<{
	[id]: pluginMessageFormat.PluginSettings
}> = {
	id,
	displayName,
	description,
	settingsSchema: pluginMessageFormat.PluginSettings,

	loadMessages: async ({ settings, nodeishFs }) => {
		return await pluginMessageFormat.default.loadMessages!({ settings, nodeishFs })
	},

	saveMessages: async ({ settings, nodeishFs, messages }) => {
		return await pluginMessageFormat.default.saveMessages!({ settings, nodeishFs, messages })
	},

	addCustomApi: () => mFunctionMatcher.default.addCustomApi(),
}
