import type { BundleNested } from "../database/schema.js";

/**
 * @deprecated use your own plural bundle mock. This variable will be removed at any time in the future.
 */
export const pluralBundle: BundleNested = {
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
			variants: [
				{
					messageId: "mock_message_id_de",
					id: "mock_variant_id_de_zero",
					match: { numProducts: "zero" },
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
					match: { numProducts: "one" },
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
					match: { numProducts: "other" },
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
			variants: [
				{
					messageId: "mock_message_id_en",
					id: "mock_variant_id_en_zero",
					match: { numProducts: "zero" },
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
					match: { numProducts: "one" },
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
					match: { numProducts: "other" },
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
		},
	] /*, TODO SDK-v2 LINT reports
	lintReports: {
		hash: "testHash",
		reports: [
			createMockBundleLintReport({
				ruleId: "messageBundleLintRule.inlang.missingMessage",
				messageBundleId: "mock_bundle_human_id",
				body: "The bundle `mock_bundle_human_id` is missing message for the locale `de`",
			}),
			createMockMessageLintReport({
				ruleId: "messageBundleLintRule.inlang.missingReference",
				messageBundleId: "mock_bundle_human_id",
				messageId: "mock_message_id_en",
				body: "The bundle `mock_bundle_human_id` is missing the reference message for the locale `en`",
			}),
			createMockVariantLintReport({
				ruleId: "messageBundleLintRule.inlang.missingReference",
				messageBundleId: "mock_bundle_human_id",
				messageId: "mock_message_id_en",
				body: "The bundle `mock_bundle_human_id` is missing the reference message for the locale `en`",
				variantId: "mock_variant_id_en_other",
				level: "warning",
			}),
		],
	},*/,
};
