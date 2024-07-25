import { type Static, type TLiteral, type TTemplateLiteral, Type } from "@sinclair/typebox"
import { LanguageTag } from "./language-tag.js"
import type { JSONObject } from "@inlang/json-types"
import { LintConfig, type MessageBundleLintRule, type MessageLintLevel } from "./lint.js"
import type { Plugin2 } from "./plugin.js"

/**
 * ---------------- Specific Language Tag field meta information ----------------
 */

// TODO SDK-v2 SETTINGS naming?
const BaseLocale = LanguageTag
BaseLocale.title = "Source language tag"
BaseLocale.description =
	"Set the reference language for your project. It needs to be a valid BCP-47 language tag."

const InternalProjectSettings = Type.Object({
	// TODO SDK-v2 SETTINGS do we need to generate a settings v2 schema?
	$schema: Type.Optional(Type.Literal("https://inlang.com/schema/project-settings")),
	baseLocale: BaseLocale,
	locales: Type.Array(LanguageTag, {
		uniqueItems: true,
		title: "Project Locales",
		description:
			"Set the locales that are available in your project. All locales needs to be a valid BCP-47 language tag. Needs to include the base locale tag.",
	}),

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
				description: "The module must be a valid URI according to RFC 3986.",
				pattern:
					"(?:[A-Za-z][A-Za-z0-9+.-]*:/{2})?(?:(?:[A-Za-z0-9-._~]|%[A-Fa-f0-9]{2})+(?::([A-Za-z0-9-._~]?|[%][A-Fa-f0-9]{2})+)?@)?(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\\.){1,126}[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?::[0-9]+)?(?:/(?:[A-Za-z0-9-._~]|%[A-Fa-f0-9]{2})*)*(?:\\?(?:[A-Za-z0-9-._~]+(?:=(?:[A-Za-z0-9-._~+]|%[A-Fa-f0-9]{2})+)?)(?:&|;[A-Za-z0-9-._~]+(?:=(?:[A-Za-z0-9-._~+]|%[A-Fa-f0-9]{2})+)?)*)?",
			}),
			Type.String({
				description: "The module must end with `.js`.",
				pattern: ".*\\.js$",
			}),
			Type.String({
				description: "The module can only contain a major version number.",
				pattern: "^(?!.*@\\d\\.)[^]*$",
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
	lintConfig: Type.Array(LintConfig, {
		title: "Levels for lint rules",
		description:
			"Adjust the lint rule levels in your project to choose between 'warning', 'error' and 'off'. If set to 'error', you can configure a CI process to prevent merging with existing reports. (When you want to configure your lint rules visit inlang.com/c/lint-rules)",
	}),
	experimental: Type.Optional(
		Type.Record(Type.String(), Type.Literal(true), {
			title: "Experimental settings",
			description: "Experimental settings that are used for product development.",
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
		pattern: `^((messageBundleLintRule|plugin|app|library)\\.([a-z][a-zA-Z0-9]*)\\.([a-z][a-zA-Z0-9]*(?:[A-Z][a-z0-9]*)*)|\\$schema|${Object.keys(
			InternalProjectSettings.properties
		)
			.map((key) => key.replaceAll(".", "\\."))
			.join("|")})$`,
		description:
			"The key must be conform to `{type:app|plugin|messageBundleLintRule}.{namespace:string}.{id:string}`.",
		examples: ["plugin.publisher.sqlite", "messageBundleLintRule.inlang.missingTranslation"],
	}) as unknown as TTemplateLiteral<
		[TLiteral<`${"app" | "plugin" | "library" | "messageBundleLintRule"}.${string}.${string}`>]
	>,
	// Using JSON (array and object) as a workaround to make the
	// intersection between `InternalSettings`, which contains an array,
	// and `ExternalSettings` which are objects possible
	JSON as unknown as typeof JSONObject,
	{ description: "Settings defined by apps, plugins, etc." }
)

export type ProjectSettings2 = Static<typeof ProjectSettings2>
export const ProjectSettings2 = Type.Intersect([InternalProjectSettings, ExternalProjectSettings])

export type InstalledPlugin = {
	id: Plugin2["id"]
	displayName: Plugin2["displayName"]
	description: Plugin2["description"]
	/**
	 * The module which the plugin is installed from.
	 */
	module: string
	settingsSchema: Plugin2["settingsSchema"]
	// disabled: boolean
}

export type InstalledLintRule = {
	id: MessageBundleLintRule["id"]
	displayName: MessageBundleLintRule["displayName"]
	description: MessageBundleLintRule["description"]
	/**
	 * The module which the lint rule is installed from.
	 */
	module: string
	level: MessageLintLevel
	settingsSchema: MessageBundleLintRule["settingsSchema"]
}
