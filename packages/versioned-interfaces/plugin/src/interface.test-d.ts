/* eslint-disable @typescript-eslint/no-unused-vars */
import { Type } from "@sinclair/typebox";
import type { Plugin } from "./interface.js";

// -- it should be possible to extend the settings with the plugin's settings --

const id = "plugin.placeholder.name";

type PluginSettings = {
  filePath: string;
};

const plugin: Plugin<{
  [id]: PluginSettings;
}> = {
  id: id,
  displayName: "Placeholder plugin",
  description: "Inlang plugin for the message format",
  loadMessages: async ({ settings }) => {
    settings["plugin.placeholder.name"] satisfies PluginSettings;
    return [];
  },
  saveMessages: async ({ settings }) => {
    settings["plugin.placeholder.name"] satisfies PluginSettings;
  },
  addCustomApi: ({ settings }) => {
    settings["plugin.placeholder.name"] satisfies PluginSettings;
    return {};
  },
};

// -- it should be possible to use a plugin without a generic --

const plugin2: Plugin = {} as any;
