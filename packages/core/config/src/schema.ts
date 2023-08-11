import { Static, TLiteral, TTemplateLiteral, Type } from "@sinclair/typebox"
import { LanguageTag } from "@inlang/language-tag"

/**
 * ---------------- UTILITIES ----------------
 */

const JSONValue = Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
const JSONArray = Type.Array(JSONValue)
// avoiding recursive types in JSON object
const NestedJSONObject = Type.Record(Type.String(), Type.Union([JSONValue, JSONArray]))

export type JSONObject = Static<typeof JSONObject>
const JSONObject = Type.Record(Type.String(), Type.Union([JSONValue, JSONArray, NestedJSONObject]))

/**
 * ---------------- SYSTEM SETTINGS ----------------
 */

export type SystemSettings = Static<typeof SystemSettings>
export const SystemSettings = Type.Object({
	/**
	 * The lint rule levels used by the system.
	 */
	"system.lintRuleLevels": Type.Optional(
		Type.Record(
			Type.TemplateLiteral("${string}.lintRule${string}"),
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
		pattern: "^(?!system\\.)[a-z0-9]+(?:[A-Z][a-z0-9]+)*\\.[a-z][a-zA-Z0-9]*$",
		description:
			"The key must be conform to the `{namespace}.{key}` pattern and can't start with `system`.",
		examples: ["example.pluginSqlite", "example.lintRuleMissingMessage"],
	}) as unknown as TTemplateLiteral<[TLiteral<`${string}.${string}`>]>,
	JSONObject,
	{
		additionalProperties: false,
	},
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
		 * The `key` must be conform to the `{namespace}.{key}` pattern.
		 * The `value` must be a JSON.
		 */
		settings: Type.Intersect([SystemSettings, ExternalSettings]),
	},
	// see https://github.com/sinclairzx81/typebox/issues/527
	{ additionalProperties: false },
)
