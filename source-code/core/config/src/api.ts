import type { LanguageTag } from "@inlang/language-tag"
import { z } from "zod"

export type InlangConfig = {
	sourceLanguageTag: LanguageTag
	languageTags: LanguageTag[]
	/**
	 * The modules to load.
	 *
	 * @example
	 *  modules: [
	 * 	  "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@3/dist/index.js",
	 * 	  "https://cdn.jsdelivr.net/npm/@inlang/plugin-csv@1/dist/index.js",
	 *  ]
	 */
	modules: string[]
	settings?: {
		plugins?: Record<string, PluginSettings>
		lintRules?: Record<string, LintRuleSettings>
	}
}

/**
 * The settings of a plugin.
 */
export type PluginSettings = {
	options?: PluginOptions
}

/**
 * The options of a lint rule.
 *
 * The options are defined by a user via the `LintRuleSettings`.
 *
 * ```bash
 * └── config: InlangConfig
 *   └── settings: InlangConfig["settings"]
 *       └── lintRule: LintRuleSettings
 *           ├── options: PluginOptions
 *           └── ...other properties of LintRuleSettings
 * ```
 */
export type LintRuleSettings = {
	options?: PluginOptions
	level?: "off" | "warning" | "error"
}

/**
 * The options of a plugin.
 *
 * The options are defined by a user via the `PluginSettings`.
 *
 * ```bash
 * └── config: InlangConfig
 *   └── settings: InlangConfig["settings"]
 *       └── plugins: PluginSettings
 *           ├── options: PluginOptions
 *           └── ...other properties of PluginSettings
 * ```
 */
export type PluginOptions = Record<string, string | string[] | Record<string, string>>

/**
 * ------------- Zod Types -------------
 */

export const PluginSettings = z.object({
	options: z.record(z.union([z.string(), z.array(z.string())])).optional(),
})

export const LintRuleSettings = z.object({
	options: z.record(z.union([z.string(), z.array(z.string())])).optional(),
	level: z.union([z.literal("off"), z.literal("warning"), z.literal("error")]).optional(),
})

export const InlangConfig = z.object({
	// TODO validate valid language tag
	sourceLanguageTag: z.string(),
	// TODO validate valid language tags
	languageTags: z.array(z.string()),
	modules: z.array(z.string()),
	settings: z.object({
		plugins: z.record(PluginSettings),
		lintRules: z.record(LintRuleSettings),
	}),
})
