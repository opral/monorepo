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
 * The settings of a lint rule.
 */
export type LintRuleSettings = {
	options?: PluginOptions
	level?: "off" | "warning" | "error"
}

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
