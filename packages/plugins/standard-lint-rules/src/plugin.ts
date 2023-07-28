import type { PluginApi } from "@inlang/plugin"
import * as rules from "./rules/index.js"

/**
 * This plugin provides a set of standard lint rules.
 */
export const standardLintRules: PluginApi = {
	meta: {
		id: "inlang.standardLintRules",
		displayName: {
			en: "Standard Lint Rules",
		},
		description: {
			en: "This plugin provides a set of standard lint rules.",
		},
		keywords: ["lint"],
		usedApis: ["addLintRules"], // TODO: why do we need to specify this? // reply from @samuelstroschein: because the plugin registry and debugging can be improved by knowing which apis are used
	},
	setup: () => {
		return {
			addLintRules: () => [
				rules.identicalPattern({ ignore: [] }),
				rules.messageWithoutSource(),
				rules.missingMessage(),
			],
		}
	},
}

// TODO: reintroduce `createPlugin` and `creteLintRule` helper functions
// standardLintRules.setup({options: { identicalPattern: ['warn'] as const}})

// TODO: how to apply options to rules?
