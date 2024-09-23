import type { Bundle, Message, Variant } from "@inlang/sdk2"

export const examplePlural: {
	bundles: Bundle[]
	messages: Message[]
	variants: Variant[]
} = {
	bundles: [
		{
			id: "mock_bundle_human_id",
			declarations: [
				{
					type: "input-variable",
					name: "numProducts",
				},
				{
					type: "input-variable",
					name: "count",
				},
				{
					type: "input-variable",
					name: "projectCount",
				},
			],
		},
	],
	messages: [
		{
			bundleId: "mock_bundle_human_id",
			id: "mock_message_id_de",
			locale: "de",
			selectors: [
				{
					type: "variable-reference",
					name: "numProducts",
				},
			],
		},
		{
			bundleId: "mock_bundle_human_id",
			id: "mock_message_id_en",
			locale: "en",
			selectors: [
				{
					type: "variable-reference",
					name: "numProducts",
				},
			],
		},
	],
	variants: [
		{
			messageId: "mock_message_id_de",
			id: "mock_variant_id_de_zero",
			matches: [
				{
					type: "match",
					name: "numProducts",
					value: { type: "literal", value: "zero" },
				},
			],
			pattern: [
				{
					type: "text",
					value: "Keine Produkte",
				},
			],
		},
		{
			messageId: "mock_message_id_de",
			id: "mock_variant_id_de_one",
			matches: [
				{
					type: "match",
					name: "numProducts",
					value: { type: "literal", value: "one" },
				},
			],
			pattern: [
				{
					type: "text",
					value: "Ein Produkt",
				},
			],
		},
		{
			messageId: "mock_message_id_de",
			id: "mock_variant_id_de_other",
			matches: [
				{
					type: "match",
					name: "numProducts",
					value: { type: "literal", value: "other" },
				},
			],
			pattern: [
				{
					type: "expression",
					arg: {
						type: "variable-reference",
						name: "numProducts",
					},
				},
				{
					type: "text",
					value: " Produkte",
				},
			],
		},
		{
			messageId: "mock_message_id_en",
			id: "mock_variant_id_en_zero",
			matches: [
				{
					type: "match",
					name: "numProducts",
					value: { type: "literal", value: "zero" },
				},
			],
			pattern: [
				{
					type: "text",
					value: "No Products",
				},
			],
		},
		{
			messageId: "mock_message_id_en",
			id: "mock_variant_id_en_one",
			matches: [
				{
					type: "match",
					name: "numProducts",
					value: { type: "literal", value: "one" },
				},
			],
			pattern: [
				{
					type: "text",
					value: "A product",
				},
			],
		},
		{
			messageId: "mock_message_id_en",
			id: "mock_variant_id_en_other",
			matches: [
				{
					type: "match",
					name: "numProducts",
					value: { type: "literal", value: "other" },
				},
			],
			pattern: [
				{
					type: "expression",
					arg: {
						type: "variable-reference",
						name: "numProducts",
					},
				},
				{
					type: "text",
					value: " products",
				},
			],
		},
	],
}
