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
	/**
	 * The resolved plugins.
	 *
	 * @example
	 *   plugins: {
	 *     "inlang.i18next": {
	 * 	     options: {
	 * 	       ignore: ["inlang", "globalization"],
	 * 	     },
	 *   }
	 */
	plugins: Record<string, PluginSettings>
	/**
	 * The linting system.
	 */
	lint: {
		/**
		 * The resolved linting rules.
		 *
		 * @example
		 *  rules: {
		 * 	  "inlang.missing-message": {
		 * 		  level: "off",
		 * 	  },
		 */
		rules: Record<string, LintRuleSettings>
	}
}

/**
 * The settings of a plugin.
 */
export type PluginSettings = {
	options: Record<string, string | string[]>
}

/**
 * The settings of a lint rule.
 */
export type LintRuleSettings = {
	options?: Record<string, string | string[]>
	level: "off" | "warning" | "error"
}

/**
 * ------------- Zod Types -------------
 */

export const PluginSettings = z.object({
	options: z.record(z.union([z.string(), z.array(z.string())])),
})

export const LintRuleSettings = z.object({
	options: z.record(z.union([z.string(), z.array(z.string())])).optional(),
	level: z.union([z.literal("off"), z.literal("warning"), z.literal("error")]),
})

export const InlangConfig = z.object({
	// TODO validate valid language tag
	sourceLanguageTag: z.string(),
	// TODO validate valid language tags
	languageTags: z.array(z.string()),
	modules: z.array(z.string()),
	plugins: z.record(PluginSettings),
	lint: z.object({
		rules: z.record(LintRuleSettings),
	}),
})
