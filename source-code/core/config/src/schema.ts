import { Static, TLiteral, TTemplateLiteral, Type } from "@sinclair/typebox"
import { LanguageTag } from "@inlang/language-tag"

const JSONValue = Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
const JSONArray = Type.Array(JSONValue)
const JSONObject = Type.Record(Type.String(), Type.Union([JSONValue, JSONArray]))

// JSON utility
export type JSON = Static<typeof JSON>
export const JSON = Type.Union([JSONValue, JSONArray, JSONObject])

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
		settings: Type.Record(
			Type.String({
				pattern: "^(?:[a-z0-9]+(?:-[a-z0-9]+)*)?\\.[a-z0-9]+(?:-[a-z0-9]+)*$",
				description:
					"Settings are key-value pairs. The key must be conform to the `{namespace}.{key}` pattern. The value must be a JSON.",
				examples: ["example.plugin-sqlite", "example.lint-rule-missing-message"],
			}) as unknown as TTemplateLiteral<[TLiteral<`${string}.${string}`>]>,
			JSON,
			{
				// see https://github.com/sinclairzx81/typebox/issues/527
				additionalProperties: false,
			},
		),
	},
	// see https://github.com/sinclairzx81/typebox/issues/527
	{ additionalProperties: false },
)
