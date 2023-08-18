import { Static, TLiteral, TTemplateLiteral, Type } from "@sinclair/typebox"
import { LanguageTag } from "@inlang/language-tag"
import { LintLevel, LintRule } from "@inlang/lint"
import { JSONSerializableObject } from "@inlang/json-serializable"

/**
 * ---------------- UTILITY TYPES ----------------
 */

// workaround to get the id from a union type
const LintRuleId = LintRule["allOf"][0]["properties"]["meta"]["properties"]["id"]

/**
 * ---------------- SYSTEM SETTINGS ----------------
 */

export type SystemSettings = Static<typeof SystemSettings>
export const SystemSettings = Type.Object({
	"system.disabled": Type.Optional(
		Type.Array(Type.Union([LintRuleId]), {
			// in the future plugins too
			description: "The lint rules that should be disabled.",
			examples: [["inlang.lintRule.missingMessage", "inlang.lintRule.patternInvalid"]],
		}),
	),
	"system.lintRuleLevels": Type.Optional(
		Type.Record(LintRuleId, LintLevel, {
			description: "The lint rule levels. To disable a lint rule, use `system.disabled`.",
			examples: [
				{ "inlang.lintRule.missingMessage": "error", "inlang.lintRule.patternInvalid": "warning" },
			],
		}),
	),
})

/**
 * ---------------- EXTERNAL SETTINGS ----------------
 */

/**
 * Settings defined via apps, plugins, lint rules, etc.
 */
const ExternalSettings = Type.Record(
	Type.String({
		// pattern includes SystemSettings keys
		pattern: `^((?!system\\.)([a-z]+)\\.(app|plugin|lintRule)\\.([a-z][a-zA-Z0-9]*)|${Object.keys(
			SystemSettings.properties,
		)
			.map((key) => key.replaceAll(".", "\\."))
			.join("|")})$`,
		description:
			"The key must be conform to `{namespace:string}.{type:app|plugin|lintRule}.{name:string}`. The namespace `system` namespace is reserved and can't be used.",
		examples: ["example.plugin.sqlite", "example.lintRule.missingMessage"],
	}) as unknown as TTemplateLiteral<
		[TLiteral<`${string}.${"app" | "plugin" | "lintRule"}.${string}`>]
	>,
	JSONSerializableObject,
	{ additionalProperties: false },
)

/**
 * ---------------- CONFIG ----------------
 */

/**
 * The inlang config.
 */
export type InlangConfig = Static<typeof InlangConfig>
export const InlangConfig = Type.Object(
	{
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
		/**
		 * Settings are key-value pairs.
		 *
		 * The `key` must be conform to the `{namespace}.{type}.{key}` pattern.
		 * The `value` must be a JSON.
		 */
		settings: Type.Intersect([SystemSettings, ExternalSettings]),
	},
	// see https://github.com/sinclairzx81/typebox/issues/527
	{ additionalProperties: false },
)
