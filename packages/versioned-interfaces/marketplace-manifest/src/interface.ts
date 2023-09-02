import { Type, type Static } from "@sinclair/typebox"
import { Translatable } from "@inlang/translatable"

const MarketplaceManifestBase = Type.Object({
	icon: Type.Optional(Type.String()),
	name: Translatable(Type.String()),
	description: Translatable(Type.String()),
	readme: Translatable(Type.String()),
	keywords: Type.Array(Type.String()),
	publisherName: Type.String(),
	publisherIcon: Type.Optional(Type.String()),
	license: Type.Literal("Apache-2.0"),
	website: Type.Optional(
		Type.String({ description: "An optional link to the website of the marketplace item." }),
	),
})

export const App = Type.Intersect([
	MarketplaceManifestBase,
	Type.Object({
		type: Type.Literal("app"),
	}),
])

const Library = Type.Intersect([
	MarketplaceManifestBase,
	Type.Object({
		type: Type.Literal("library"),
	}),
])

const Module = Type.Intersect([
	MarketplaceManifestBase,
	Type.Object({
		module: Type.String({ description: "The link to the module" }),
	}),
])

const Plugin = Type.Intersect([
	Module,
	Type.Object({
		type: Type.Literal("plugin"),
	}),
])

const MessageLintRule = Type.Intersect([
	Module,
	Type.Object({
		type: Type.Literal("lintRule"),
	}),
])

export type MarketplaceManifest = Static<typeof MarketplaceManifest>
export const MarketplaceManifest = Type.Union([App, Library, Plugin, MessageLintRule], {
	description: "The manifest of a marketplace item.",
})

