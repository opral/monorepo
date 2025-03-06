import type { InlangPlugin } from "@inlang/sdk";
import type { PluginSettings } from "./settings.js";
import { config } from "./ideExtension/config.js";
import { pluginV4 } from "./legacy/plugin.v4.js";
import { importFiles } from "./import-export/importFiles.js";
import { exportFiles } from "./import-export/exportFiles.js";
import { toBeImportedFiles } from "./import-export/toBeImportedFiles.js";

export const PLUGIN_KEY = "plugin.inlang.i18next";

export const plugin: InlangPlugin<{
	[PLUGIN_KEY]: PluginSettings;
}> = {
	id: pluginV4.id,
	key: PLUGIN_KEY,
	// @ts-expect-error - displayName is not in the v2 plugin
	displayName: pluginV4.displayName,
	// @ts-expect-error - description is not in the v2 plugin
	description: pluginV4.description,
	addCustomApi: pluginV4.addCustomApi,
	loadMessages: pluginV4.loadMessages,
	saveMessages: pluginV4.saveMessages,
	importFiles,
	exportFiles,
	toBeImportedFiles,
	meta: {
		"app.inlang.ideExtension": config,
	},
};
