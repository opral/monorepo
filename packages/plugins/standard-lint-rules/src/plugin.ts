import { createPlugin } from "@inlang/core/plugin"
import * as rules from "./rules/index.js"
import type { LintRule } from "@inlang/core/lint"

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
export const standardLintRules = createPlugin<PluginSettings>(({ settings }) => ({
	id: "inlang.standardLintRules",
	config() {
		return {
			lint: {
				rules: [
					withDefaultLevel("identicalPattern", "warn", settings),
					withDefaultLevel("messageWithoutReference", "error", settings),
					withDefaultLevel("missingMessage", "error", settings),
				].filter((rule) => rule !== "off") as LintRule[],
			},
		}
	},
}))

type PluginSettings = Partial<Record<keyof typeof rules, "off" | "warn" | "error">>

function withDefaultLevel(
	name: keyof typeof rules,
	defaultLevel: "off" | "warn" | "error",
	settings: PluginSettings,
) {
	const level = settings?.[name] ?? defaultLevel
	if (level === "off") {
		return "off"
	}
	return rules[name](level)
}
