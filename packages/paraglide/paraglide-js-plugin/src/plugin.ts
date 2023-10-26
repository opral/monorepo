import { Plugin } from "@inlang/plugin"
import { displayName, description } from "../marketplace-manifest.json"
import { PluginSettings } from "./settings.js"
import { ideExtensionConfig } from "./ideExtension/config.js"

const id = "plugin.inlang.paraglideJs"

export const plugin: Plugin<{
	[id]: PluginSettings
}> = {
	id,
	displayName,
	description,
	addCustomApi: () => ideExtensionConfig(),
}
