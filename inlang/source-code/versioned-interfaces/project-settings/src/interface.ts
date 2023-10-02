import { type Static, type TLiteral, type TTemplateLiteral, Type } from "@sinclair/typebox"
import { LanguageTag } from "@inlang/language-tag"
import { JSON, type JSONObject } from "@inlang/json-types"

/**
 * ---------------- AVOIDING CIRCULAR DEPENDENCIES ----------------
 *
 * The types beneath belong to other packages that depent on project settings
 * and must therefore be declared here to avoid circular dependencies.
 *
 */

export const _MessageLintRuleId = Type.String({
	pattern: "^messageLintRule\\.([a-z][a-zA-Z0-9]*)\\.([a-z][a-zA-Z0-9]*(?:[A-Z][a-z0-9]*)*)$",
	description: "The key must be conform to `messageLintRule.{namespace}.{id}` pattern.",
	examples: [
		"messageLintRule.namespace.patternInvalid",
		"messageLintRule.namespace.missingTranslation",
	],
}) as unknown as TTemplateLiteral<[TLiteral<`messageLintRule.${string}.${string}`>]>

export const _MessageLintRuleLevel = Type.Union([Type.Literal("error"), Type.Literal("warning")])

/**
 * ---------------- Settings ----------------
 */

const InternalProjectSettings = Type.Object({
	$schema: Type.Optional(Type.Literal("https://inlang.com/schema/project-settings")),
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
		}
	),
	messageLintRuleLevels: Type.Optional(
		Type.Record(_MessageLintRuleId, _MessageLintRuleLevel, {
			description: "The lint rule levels for messages.",
			examples: [
				{
					"messageLintRule.inlang.missingTranslation": "error",
					"messageLintRule.inlang.patternInvalid": "warning",
				},
			],
		})
	),
})

/**
 * Settings defined via apps, plugins, lint rules, etc.
 */
export type ExternalProjectSettings = Static<typeof ExternalProjectSettings>
export const ExternalProjectSettings = Type.Record(
	Type.String({
		// pattern includes ProjectSettings keys
		pattern: `^((messageLintRule|plugin|app|library)\\.([a-z][a-zA-Z0-9]*)\\.([a-z][a-zA-Z0-9]*(?:[A-Z][a-z0-9]*)*)|\\$schema|${Object.keys(
			InternalProjectSettings.properties
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
	// intersection between `InternalSettings`, which contains an array,
	// and `ExternalSettings` which are objects possible
	JSON as unknown as typeof JSONObject,
	{ additionalProperties: false, description: "Settings defined by apps, plugins, etc." }
)

export type ProjectSettings = Static<typeof ProjectSettings>
export const ProjectSettings = Type.Intersect([InternalProjectSettings, ExternalProjectSettings])
