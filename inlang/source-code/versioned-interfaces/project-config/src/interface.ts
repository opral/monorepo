import { type Static, type TLiteral, type TTemplateLiteral, Type } from "@sinclair/typebox"
import { LanguageTag } from "@inlang/language-tag"
import { MessageLintLevel, MessageLintRule } from "@inlang/message-lint-rule"
import { JSON, JSONObject } from "@inlang/json-types"

/**
 * ---------------- UTILITY TYPES ----------------
 */

// workaround to get the id from a union type
const MessageLintRuleId = MessageLintRule["properties"]["meta"]["properties"]["id"]

export const Disabled = Type.Array(Type.Union([MessageLintRuleId]), {
	// in the future plugins too
	description: "The lint rules that should be disabled.",
	examples: [["lintRule.inlang.missingTranslation", "lintRule.inlang.patternInvalid"]],
})

/**
 * ---------------- PROJECT SETTINGS ----------------
 */

export type ProjectSettings = Static<typeof ProjectSettings>
export const ProjectSettings = Type.Object({
	"project.messageLintRuleLevels": Type.Optional(
		Type.Record(MessageLintRuleId, MessageLintLevel, {
			description: "The lint rule levels for messages.",
			examples: [
				{
					"messageLintRule.inlang.missingTranslation": "error",
					"messageLintRule.inlang.patternInvalid": "warning",
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
		pattern: `^((messageLintRule|plugin|app|library)\\.([a-z][a-zA-Z0-9]*)\\.([a-z][a-zA-Z0-9]*(?:[A-Z][a-z0-9]*)*)|${Object.keys(
			ProjectSettings.properties,
		)
			.map((key) => key.replaceAll(".", "\\."))
			.join("|")})$`,
		description:
			"The key must be conform to `{type:app|plugin|messageLintRule}.{namespace:string}.{id:string}`.",
		examples: ["plugin.publisher.sqlite", "messageLintRule.inlang.missingTranslation"],
	}) as unknown as TTemplateLiteral<
		[TLiteral<`${"app" | "plugin" | "library" | "messageLintRule"}.${string}.${string}`>]
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
		languageTags: Type.Array(LanguageTag, { uniqueItems: true }),
		/**
		 * The modules to load.
		 *
		 * @example
		 *  modules: [
		 * 	  "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@3/dist/index.js",
		 * 	  "https://cdn.jsdelivr.net/npm/@inlang/plugin-csv@1/dist/index.js",
		 *  ]
		 */
		modules: Type.Array(
			Type.Intersect([
				Type.String({
					pattern:
						"(?:[A-Za-z][A-Za-z0-9+.-]*:/{2})?(?:(?:[A-Za-z0-9-._~]|%[A-Fa-f0-9]{2})+(?::([A-Za-z0-9-._~]?|[%][A-Fa-f0-9]{2})+)?@)?(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\\.){1,126}[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?::[0-9]+)?(?:/(?:[A-Za-z0-9-._~]|%[A-Fa-f0-9]{2})*)*(?:\\?(?:[A-Za-z0-9-._~]+(?:=(?:[A-Za-z0-9-._~+]|%[A-Fa-f0-9]{2})+)?)(?:&|;[A-Za-z0-9-._~]+(?:=(?:[A-Za-z0-9-._~+]|%[A-Fa-f0-9]{2})+)?)*)?",
					description: "The module must be a valid URI according to RFC 3986.",
				}),
				Type.String({
					pattern: ".*\\.js$",
					description: "The module must end with `.js`.",
				}),
				Type.String({
					pattern: "^(?!.*@\\d\\.)[^]*$",
					description:
						"The module can only contain a major version number (ComVer, not SemVer). See https://inlang.com/documentation/comver",
				}),
			]),
			{
				uniqueItems: true,
				description: "The modules to load. Must be a valid URI but can be relative.",
				examples: [
					"https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@3/dist/index.js",
					"https://cdn.jsdelivr.net/npm/@inlang/plugin-csv@1/dist/index.js",
					"./local-testing-plugin.js",
				],
			},
		),
		/**
		 * Settings are key-value pairs.
		 */
		settings: Type.Intersect([ProjectSettings, ExternalSettings]),
	},
	// see https://github.com/sinclairzx81/typebox/issues/527
	{ additionalProperties: false },
)
