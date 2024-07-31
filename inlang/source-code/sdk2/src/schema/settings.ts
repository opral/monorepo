import { type Static, Type } from "@sinclair/typebox"
import { JSONObject } from "@inlang/json-types"

/**
 * ---------------- Specific Language Tag field meta information ----------------
 */

export type ProjectSettings2 = Static<typeof ProjectSettings2>
const ProjectSettings2 = Type.Object({
	// TODO SDK-v2 SETTINGS do we need to generate a settings v2 schema?
	$schema: Type.Optional(Type.Literal("https://inlang.com/schema/project-settings")),
	baseLocale: Type.String({
		title: "Base locale",
		description: "The base locale of the project. We recommend BCP-47 language tags.",
	}),
	locales: Type.Array(Type.String(), {
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
	experimental: Type.Optional(
		Type.Record(Type.String(), Type.Literal(true), {
			title: "Experimental settings",
			description: "Experimental settings that are used for product development.",
		})
	),
	/**
	 * Settings defined by plugins.
	 *
	 * @example
	 *   plugin: {
	 *     "i18next": {},
	 *     "messageFormat": {}
	 *   }
	 */
	plugin: Type.Record(Type.String(), JSONObject, {
		description: "Settings defined by plugins. Referencable by plugin key.",
	}),
})
