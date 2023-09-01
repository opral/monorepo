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
	...MarketplaceSchemaBase.props,
	linkToApp: Type.String(),
})

const MarketplaceLibrary = Type.Object({
	...MarketplaceSchemaBase.props,
})

const MarketplaceModule = Type.Object({
	...MarketplaceSchemaBase.props,
	module: Type.String(),
})

export type MarketplaceItem = Static<typeof MarketplaceItem>
export const MarketplaceItem = Type.Union([MarketplaceApp, MarketplaceLibrary, MarketplaceModule])

export const marketplaceItems = registry as unknown as MarketplaceItem[]

/* JSON schema used in the manifest files */
export const MarketplaceSchema = {
	$schema: "https://json-schema.org/draft/2020-12/schema",
	$id: "https://inlang.com/marketplace-manifest-schema.json",
	title: "Inlang Marketplace Manifest",
	description: "A manifest for inlang marketplace items",
	type: "object",
	properties: {
		type: {
			description: "The type of marketplace item",
			type: "string",
		},
		icon: {
			description: "A link to the icon of the marketplace item",
			type: "string",
		},
		displayName: {
			description: "The name of the marketplace item",
			type: "object",
			properties: {
				en: {
					description: "The english name of the marketplace item",
					type: "string",
				},
			},
			required: ["en"],
		},
		description: {
			description: "The description of the marketplace item",
			type: "object",
			properties: {
				en: {
					description: "The english description of the marketplace item",
					type: "string",
				},
			},
			required: ["en"],
		},
		linkToReadme: {
			description: "A link to the readme of the marketplace item",
			type: "object",
			properties: {
				en: {
					description: "A link to the english readme of the marketplace item",
					type: "string",
				},
			},
			required: ["en"],
		},
		keywords: {
			description: "Keywords to help users find the marketplace item",
			type: "array",
			items: {
				type: "string",
			},
			minItems: 1,
			uniqueItems: true,
		},
		publisherName: {
			description: "The name of the publisher of the marketplace item",
			type: "string",
		},
		publisherIcon: {
			description: "A link to the icon of the publisher of the marketplace item",
			type: "string",
		},
		license: {
			description: "The license of the marketplace item",
			type: "string",
		},
	},
	required: [
		"type",
		"displayName",
		"description",
		"linkToReadme",
		"keywords",
		"publisherName",
		"license",
	],
}
