import { Type, type Static } from "@sinclair/typebox";
import { Translatable } from "./translatable.js";

/**
 *
 * ---------------- BASE INTERFACES ----------------
 */

const MarketplaceManifestBase = Type.Object({
	$schema: Type.Optional(
		Type.Literal("https://inlang.com/schema/marketplace-manifest")
	),
	slug: Type.Optional(
		Type.RegExp(/^[a-z0-9]+(?:-[a-z0-9]+)*$/gm, {
			description:
				"The slug which overrides the slug on inlang.com. Only lowercase letters and numbers.",
		})
	),
	deprecated: Type.Optional(
		Type.Boolean({
			description:
				"If true, the item will not be shown in the marketplace listings but will still be accessible via direct URL. A deprecation banner will be shown on the item's page.",
			default: false,
		})
	),
	deprecatedMessage: Type.Optional(
		Translatable(
			Type.String({
				description:
					"A message explaining why the item is deprecated and what to use instead.",
			})
		)
	),
	icon: Type.Optional(Type.String()),
	gallery: Type.Optional(
		Type.Array(
			Type.String({
				description:
					"The images displayed in the marketplace. The first image is the cover.",
			})
		)
	),
	displayName: Translatable(
		Type.String({
			description: "The name which is displayed in the marketplace.",
		})
	),
	description: Translatable(
		Type.String({
			description: "The description which is displayed in the marketplace.",
		})
	),
	publisherName: Type.String(),
	publisherIcon: Type.Optional(Type.String()),
	publisherLink: Type.Optional(Type.String()),
	/**
	 * @deprecated Use `pages` instead.
	 */
	readme: Type.Optional(
		Translatable(
			Type.TemplateLiteral("${string}.md", {
				description: "The path to the readme file.",
			})
		)
	),
	pages: Type.Optional(
		Type.Union([
			Type.Record(
				Type.String({
					description: "The route of the page",
					example: [
						"/changelog",
						"/examples",
						"/license",
						"/api",
						"/advanced",
						"/getting-started",
					],
				}),
				Type.String({
					description: "The path to the page or link to page.",
				})
			),
			Type.Record(
				Type.String({
					description: "Namespace of the page.",
					examples: ["Documentation", "Examples", "Overview"],
				}),
				Type.Record(
					Type.String({
						description: "The route of the page",
						example: [
							"/changelog",
							"/examples",
							"/license",
							"/api",
							"/advanced",
							"/getting-started",
						],
					}),
					Type.String({
						description: "The path to the page or link to page.",
					})
				)
			),
		])
	),
	pageRedirects: Type.Optional(
		Type.Record(
			Type.String({
				description: "Old route",
			}),
			Type.String({
				description: "New route",
			})
		)
	),
	recommends: Type.Optional(
		Type.Array(
			Type.Union([
				Type.TemplateLiteral("m/${string}", {
					description:
						"The uniqueIDs, starting with m/[UNIQUEID] of the recommended items with a max amount of 3.",
				}),
				Type.TemplateLiteral("g/${string}", {
					description:
						"The uniqueIDs, starting with g/[UNIQUEID] of the recommended items with a max amount of 3.",
				}),
			])
		)
	),
	pricing: Type.Optional(Type.String()),
	keywords: Type.Array(Type.String()),
	license: Type.Optional(
		Type.String({
			description: "The license of the item (e.g. Apache-2.0).",
		})
	),
	website: Type.Optional(
		Type.String({
			description: "An optional link to the website of the item.",
		})
	),
	repository: Type.Optional(
		Type.String({
			description:
				"The GitHub repository URL (e.g. https://github.com/opral/paraglide-js).",
		})
	),
});

const ModuleBase = Type.Intersect([
	MarketplaceManifestBase,
	Type.Object({
		module: Type.String(),
	}),
]);

/**
 * ---------------- MARKETPLACE ITEMS ----------------
 */

const App = Type.Intersect([
	MarketplaceManifestBase,
	Type.Object({
		pricing: Type.Optional(
			Type.String({
				description:
					"The pricing model of the app (e.g. free, paid, subscription).",
			})
		),
		id: Type.TemplateLiteral("app.${string}.${string}"),
	}),
]);

const Library = Type.Intersect([
	MarketplaceManifestBase,
	Type.Object({
		id: Type.TemplateLiteral("library.${string}.${string}"),
	}),
]);

const Plugin = Type.Intersect([
	ModuleBase,
	Type.Object({
		id: Type.TemplateLiteral("plugin.${string}.${string}"),
	}),
]);

const MessageLintRule = Type.Intersect([
	ModuleBase,
	Type.Object({
		id: Type.TemplateLiteral("messageLintRule.${string}.${string}"),
	}),
]);

const Guide = Type.Intersect([
	MarketplaceManifestBase,
	Type.Object({
		id: Type.TemplateLiteral("guide.${string}.${string}"),
	}),
]);

export type MarketplaceManifest = Static<typeof MarketplaceManifest>;
export const MarketplaceManifest = Type.Union(
	[App, Library, Plugin, MessageLintRule, Guide],
	{
		description: "The manifest of a marketplace item.",
	}
);
