import type { InlangPlugin } from "@inlang/sdk2";
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
  addCustomApi: pluginV4.addCustomApi,
  loadMessages: pluginV4.loadMessages,
  saveMessages: pluginV4.saveMessages,
  importFiles,
  exportFiles,
  toBeImportedFiles,
  meta: {
    "app.inlang.ide-extension": config,
  },
};
