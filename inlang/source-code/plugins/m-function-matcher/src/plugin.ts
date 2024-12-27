import { PluginSettings } from "./settings.js";
import { ideExtensionConfig } from "./ideExtension/config.js";
import type { InlangPlugin } from "@inlang/sdk";

const key = "plugin.inlang.mFunctionMatcher";

export const plugin: InlangPlugin<{
	[key]: PluginSettings;
}> = {
	id: key,
	key,
	addCustomApi: () => ideExtensionConfig(),
};
