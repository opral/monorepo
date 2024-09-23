import type { InlangPlugin } from "@inlang/sdk2"
import type { PluginSettings } from "./settings.js"
import { config } from "./ideExtension/config.js"
import { pluginV4 } from "./legacy/plugin.v4.js"

export const PLUGIN_KEY = "plugin.inlang.i18next"

export const plugin: InlangPlugin<{
	[PLUGIN_KEY]: PluginSettings
}> = {
	id: pluginV4.id,
	key: PLUGIN_KEY,
	addCustomApi: pluginV4.addCustomApi,
	loadMessages: pluginV4.loadMessages,
	saveMessages: pluginV4.saveMessages,
	meta: {
		"app.inlang.ide-extension": config,
	},
}
