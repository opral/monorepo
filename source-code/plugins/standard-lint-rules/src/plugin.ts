import type { PluginApi } from "@inlang/plugin-api"
import * as rules from "./rules/index.js"

type StandardLintRulePluginOptions = Partial<Record<keyof typeof rules, "off" | "warn" | "error">>

/**
 * This plugin provides a set of standard lint rules.
 *
 * All lint rules have a default level that can be overwritten
 * in the plugin settings.
 *
 * @example
 *  plugins: [
 *    standardLintRules({
 *      identicalPattern: "warn",
 *      messageWithoutReference: "error",
 *      missingMessage: "off",
 *    })
 *  ]
 */
export const standardLintRules = {
	meta: {
		id: "inlang.standardLintRules",
		displayName: {
			en: "Standard Lint Rules",
		},
		description: {
			en: "This plugin provides a set of standard lint rules.",
		},
		keywords: ["lint"],
		usedApis: ["addLintRules"], // TODO: why do we need to specify this?
	},
	setup: ({ options }) => {
		return {
			addLintRules: () => [
				withDefaultLevel("identicalPattern", "warn", options),
				withDefaultLevel("messageWithoutReference", "error", options),
				withDefaultLevel("missingMessage", "error", options),
			]
		}
	},
} satisfies PluginApi<StandardLintRulePluginOptions>

function withDefaultLevel(
	name: keyof typeof rules,
	defaultLevel: "off" | "warn" | "error",
	options: StandardLintRulePluginOptions,
) {
	const level = options?.[name] ?? defaultLevel
	if (level === "off") {
		return "off"
	}
	return rules[name](level)
}


// TODO: reintroduce `createPlugin` and `creteLintRule` helper functions
// standardLintRules.setup({options: { identicalPattern: ['warn'] as const}})

// TODO: how to apply options to rules?