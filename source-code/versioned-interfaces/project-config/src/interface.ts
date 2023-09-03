import { type Static, type TLiteral, type TTemplateLiteral, Type } from "@sinclair/typebox"
import { LanguageTag } from "@inlang/language-tag"
import { LintLevel, LintRule } from "@inlang/lint-rule"
import { JSON, JSONObject } from "@inlang/json-types"

/**
 * ---------------- UTILITY TYPES ----------------
 */

// workaround to get the id from a union type
const LintRuleId = LintRule["allOf"][0]["properties"]["meta"]["properties"]["id"]

export const Disabled = Type.Array(Type.Union([LintRuleId]), {
	// in the future plugins too
	description: "The lint rules that should be disabled.",
	examples: [["lintRule.inlang.missingTranslation", "lintRule.inlang.patternInvalid"]],
})

/**
 * ---------------- PROJECT SETTINGS ----------------
 */

export type ProjectSettings = Static<typeof ProjectSettings>
export const ProjectSettings = Type.Object({
	"project.lintRuleLevels": Type.Optional(
		Type.Record(LintRuleId, LintLevel, {
			description: "The lint rule levels.",
			examples: [
				{
					"lintRule.inlang.missingTranslation": "error",
					"lintRule.inlang.patternInvalid": "warning",
				},
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
		// pattern includes ProjectSettings keys
		pattern: `^((lintRule|plugin|app)\\.([a-z][a-zA-Z0-9]*)\\.([a-z][a-zA-Z0-9]*(?:[A-Z][a-z0-9]*)*)|${Object.keys(
			ProjectSettings.properties,
		)
			.map((key) => key.replaceAll(".", "\\."))
			.join("|")})$`,
		description:
			"The key must be conform to `{type:app|plugin|lintRule}.{namespace:string}.{id:string}`.",
		examples: ["plugin.publisher.sqlite", "lintRule.inlang.missingTranslation"],
	}) as unknown as TTemplateLiteral<
		[TLiteral<`${"app" | "plugin" | "lintRule"}.${string}.${string}`>]
	>,
	// Using JSON (array and object) as a workaround to make the
	// intersection between `ProjectSettings`, which contains an array,
	// and `ExternalSettings` which are objects possible
	JSON as unknown as typeof JSONObject,
	{ additionalProperties: false },
)

/**
 * ---------------- CONFIG ----------------
 */

/**
 * The inlang config.
 */
export type ProjectConfig = Static<typeof ProjectConfig>
export const ProjectConfig = Type.Object(
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
		 */
		settings: Type.Intersect([ProjectSettings, ExternalSettings]),
	},
	// see https://github.com/sinclairzx81/typebox/issues/527
	{ additionalProperties: false },
)
