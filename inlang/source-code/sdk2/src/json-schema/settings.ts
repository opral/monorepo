import {
	type Static,
	Type,
	type TTemplateLiteral,
	type TLiteral,
} from "@sinclair/typebox";

const SDKSettings = Type.Object({
	// TODO SDK-v2 SETTINGS do we need to generate a settings v2 schema?
	$schema: Type.Optional(
		Type.Literal("https://inlang.com/schema/project-settings")
	),
	baseLocale: Type.String({
		title: "Base locale",
		description:
			"The base locale of the project. We recommend BCP-47 language tags.",
	}),
	locales: Type.Array(Type.String(), {
		uniqueItems: true,
		title: "Project Locales",
		description:
			"Set the locales that are available in your project. All locales needs to be a valid BCP-47 language tag. Needs to include the base locale tag.",
	}),
	// exits for backwards compatibility
	// remove in SDK-v3
	sourceLanguageTag: Type.Optional(
		Type.String({
			description: "Use baseLocale instead.",
			deprecated: true,
		})
	),
	// exits for backwards compatibility
	// remove in SDK-v3
	languageTags: Type.Optional(
		Type.Array(Type.String(), {
			uniqueItems: true,
			deprecated: true,
			description: "Use locales instead.",
		})
	),
	/**
	 * The modules to load.
	 *
	 * @example
	 *  modules: [
	 * 	  "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@3/dist/index.js",
	 * 	  "https://cdn.jsdelivr.net/npm/@inlang/plugin-csv@1/dist/index.js",
	 *  ]
	 */
	modules: Type.Optional(
		Type.Array(
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
				description:
					"The modules to load. Must be a valid URI but can be relative.",
				examples: [
					"https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@3/dist/index.js",
					"https://cdn.jsdelivr.net/npm/@inlang/plugin-csv@1/dist/index.js",
					"./local-testing-plugin.js",
				],
			}
		)
	),
	telemetry: Type.Optional(
		Type.Union(
			[
				Type.Literal("off", {
					description: "No telemetry events ",
				}),
			],
			{ description: "If not set, defaults to all" }
		)
	),
	experimental: Type.Optional(
		Type.Record(Type.String(), Type.Literal(true), {
			title: "Experimental settings",
			description:
				"Experimental settings that are used for product development.",
		})
	),
	/**
	 * plugin.*: JSONObject
	 *
	 * The plugin settings are validated when importing plugins
	 */
});

/**
 * Settings defined via apps, plugins, lint rules, etc.
 *
 * Using external settings to only allow `plugin.*` keys
 * and don't block the SDK from adding new settings.
 */
const ExternalSettings = Type.Record(
	Type.String({
		pattern: `^((plugin)\\.([a-z][a-zA-Z0-9]*(?:[A-Z][a-z0-9]*)*)|\\$schema|${
			// pattern must include the settings properties
			Object.keys(SDKSettings.properties)
				.map((key) => key.replaceAll(".", "\\."))
				.join("|")
		})$`,
		description: "The key must be conform to `plugin.*`.",
		examples: ["plugin.csv-importer", "plugin.i18next"],
	}) as unknown as TTemplateLiteral<[TLiteral<`${"plugin"}.${string}`>]>,
	// Using JSON (array and object) as a workaround to make the
	// intersection between `InternalSettings`, which contains an array,
	// and `ExternalSettings` which are objects possible
	Type.Record(Type.String(), Type.Any()),
	{ description: "Settings defined by apps, plugins, etc." }
);

export type ProjectSettings = Omit<
	Static<typeof ProjectSettings>,
	"languageTags" | "sourceLanguageTag"
> & {
	/** @deprecated Use `baseLocale` */
	sourceLanguageTag?: string;
	/** @deprecated Use `locales` */
	languageTags?: string[];
};
export const ProjectSettings = Type.Intersect([SDKSettings, ExternalSettings]);
