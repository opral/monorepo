import { Type, type Static } from "@sinclair/typebox"
import { Translatable } from "@inlang/translatable"
import { registry } from "./registry.js"

const MarketplaceSchemaBase = Type.Object({
	type: Type.Union([
		Type.Literal("app"),
		Type.Literal("library"),
		Type.Literal("plugin"),
		Type.Literal("lintRule"),
	]),
	icon: Type.Optional(Type.String()),
	displayName: Translatable(Type.String()),
	description: Translatable(Type.String()),
	linkToReadme: Translatable(Type.String()),
	keywords: Type.Array(Type.String()),
	publisherName: Type.String(),
	publisherIcon: Type.Optional(Type.String()),
	license: Type.Literal("Apache-2.0"),
})

const MarketplaceApp = Type.Object({
	MarketplaceSchemaBase,
	linkToApp: Type.String(),
})

const MarketplaceLibrary = Type.Object({
	MarketplaceSchemaBase,
})

const MarketplaceModule = Type.Object({
	MarketplaceSchemaBase,
	module: Type.String(),
})

export type MarketplaceSchema = Static<typeof MarketplaceSchema>
export const MarketplaceSchema = Type.Union([MarketplaceApp, MarketplaceLibrary, MarketplaceModule])

export const marketplaceItems = registry as unknown as MarketplaceSchema[]
