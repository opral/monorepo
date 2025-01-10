import { PluginSettings } from "./settings.js";
import { ideExtensionConfig } from "./ideExtension/config.js";
import type { InlangPlugin } from "@inlang/sdk";

const key = "plugin.inlang.mFunctionMatcher";

export const plugin: InlangPlugin<{
	[key]: PluginSettings;
}> = {
	id: key,
	// @ts-expect-error - displayName is not in the v2 plugin
	displayName: "Inlang M Function Matcher",
	description:
		"A plugin for the inlang SDK that uses a JSON file per language tag to store translations.",
	key,
	addCustomApi: () => ideExtensionConfig(),
};
