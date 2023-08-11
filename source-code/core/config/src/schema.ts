import { Static, Type } from "@sinclair/typebox"
import { LanguageTag } from "@inlang/language-tag"

/**
 * The options of a plugin.
 *
 * The options are defined by a user via the `PluginSettings`.
 *
 * ```diff
 * └── config: InlangConfig
 *   └── settings: InlangConfig["settings"]
 *       └── plugins: PluginSettings
 * +         ├── options: PluginOptions
 *           └── ...
 * ```
 */
export type PluginOptions = Static<typeof PluginOptions>
export const PluginOptions = Type.Record(
	Type.String(),
	Type.Union([Type.String(), Type.Any()]),
)

/**
 * The options of a lint rule.
 *
 * The options are defined by a user via the `LintRuleSettings`.
 *
 * ```diff
 * └── config: InlangConfig
 *   └── settings: InlangConfig["settings"]
 * +      └── lintRule: LintRuleSettings
 *           ├── options: PluginOptions
 *           └── ...other properties of LintRuleSettings
 * ```
 */
export type LintRuleSettings = Static<typeof LintRuleSettings>
export const LintRuleSettings = Type.Object({
	options: Type.Optional(PluginOptions),
	level: Type.Optional(
		Type.Union([Type.Literal("off"), Type.Literal("warning"), Type.Literal("error")]),
	),
})

/**
 * The settings of a plugin.
 *
 * ```diff
 * └── config: InlangConfig
 * +  └── settings: InlangConfig["settings"]
 *       └── plugins: PluginSettings
 *           ├── options: PluginOptions
 *           └── ...
 * ```
 */
export type PluginSettings = Static<typeof PluginSettings>
export const PluginSettings = Type.Object({
	options: Type.Optional(PluginOptions),
})

export type InlangConfig = Static<typeof InlangConfig>
export const InlangConfig = Type.Object({
	sourceLanguageTag: LanguageTag,
	languageTags: Type.Array(LanguageTag),
	/**
	 * The modules to load.
	 *
	 * @example
	 *  modules: [
	 * 	  "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@3/dist/index.js",
	 * 	  "https://cdn.jsdelivr.net/npm/@inlang/plugin-csv@1/dist/index.js",
	 *  ]
	 */
	modules: Type.Array(Type.String()),
	settings: Type.Optional(
		Type.Object({
			plugins: Type.Optional(Type.Record(Type.String(), PluginSettings)),
			lintRules: Type.Optional(Type.Record(Type.String(), LintRuleSettings)),
		}),
	),
})
