import { Static, TLiteral, TTemplateLiteral, Type } from "@sinclair/typebox"
import { LanguageTag } from "@inlang/language-tag"

/**
 * ---------------- UTILITIES ----------------
 */

type JSONPrimitive = boolean | null | number | string

type JSONArray = JSON[]

export type JSONObject = {
	[K in string]?: JSON
}

type JSON = JSONArray | JSONObject | JSONPrimitive

// typebox is not able to create a proper JSON type, so we need to use `any`
const JSONPrimitive = Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
const JSON = Type.Union([JSONPrimitive, Type.Array(Type.Any()), Type.Record(Type.String(), Type.Any())])
const JSONObject = Type.Record(Type.String(), JSON)

/**
 * ---------------- SYSTEM SETTINGS ----------------
 */

export type SystemSettings = Static<typeof SystemSettings>
export const SystemSettings = Type.Object({
	/**
	 * The lint rule levels used by the system.
	 */
	"system.lint.ruleLevels": Type.Optional(
		Type.Record(
			Type.TemplateLiteral([Type.String(), Type.Literal(".lintRule."), Type.String()]),
			Type.Union([Type.Literal("error"), Type.Literal("warning"), Type.Literal("off")]),
		),
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
	JSONObject,
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
