import { config } from "./ideExtension/config.js";
import { PluginSettings } from "./settings.js";
import type { InlangPlugin } from "@inlang/sdk";

const key = "plugin.inlang.tFunctionMatcher";

export const plugin: InlangPlugin<{
	[key]: PluginSettings;
}> = {
	id: key,
	// @ts-expect-error - displayName is not in the v2 plugin
	displayName: "Inlang T Function Matcher",
	description:
		"A plugin for the inlang SDK that uses a JSON file per language tag to store translations.",
	key,
	meta: {
		"app.inlang.ideExtension": config,
	},
};
