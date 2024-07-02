import type { MessageBundle } from "../../types/index.js"
import {
	createMockBundleLintReport,
	createMockMessageLintReport,
	createMockVariantLintReport,
} from "../lintRports/mockCreate.js"

export const pluralBundle: MessageBundle = {
	id: "mock_bundle_human_id",
	alias: {
		default: "mock_bundle_alias",
	},
	messages: [
		{
			id: "mock_message_id_de",
			locale: "de",
			declarations: [
				{
					type: "input",
					name: "numProducts",
					value: {
						type: "expression",
						arg: {
							type: "variable",
							name: "numProducts",
						},
					},
				},
				{
					type: "input",
					name: "count",
					value: {
						type: "expression",
						arg: {
							type: "variable",
							name: "count",
						},
					},
				},
				{
					type: "input",
					name: "projectCount",
					value: {
						type: "expression",
						arg: {
							type: "variable",
							name: "projectCount",
						},
					},
				},
			],
			selectors: [
				{
					type: "expression",
					arg: {
						type: "variable",
						name: "numProducts",
					},
					annotation: {
						type: "function",
						name: "plural",
						options: [],
					},
				},
			],
			variants: [
				{
					id: "mock_variant_id_de_zero",
					match: ["zero"],
					pattern: [
						{
							type: "text",
							value: "Keine Produkte",
						},
					],
				},
				{
					id: "mock_variant_id_de_one",
					match: ["one"],
					pattern: [
						{
							type: "text",
							value: "Ein Produkt",
						},
					],
				},
				{
					id: "mock_variant_id_de_other",
					match: ["other"],
					pattern: [
						{
							type: "expression",
							arg: {
								type: "variable",
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
			id: "mock_message_id_en",
			locale: "en",
			declarations: [
				{
					type: "input",
					name: "numProducts",
					value: {
						type: "expression",
						arg: {
							type: "variable",
							name: "numProducts",
						},
					},
				},
			],
			selectors: [
				{
					type: "expression",
					arg: {
						type: "variable",
						name: "numProducts",
					},
					annotation: {
						type: "function",
						name: "plural",
						options: [],
					},
				},
			],
			variants: [
				{
					id: "mock_variant_id_en_zero",
					match: ["zero"],
					pattern: [
						{
							type: "text",
							value: "No Products",
						},
					],
				},
				{
					id: "mock_variant_id_en_one",
					match: ["one"],
					pattern: [
						{
							type: "text",
							value: "A product",
						},
					],
				},
				{
					id: "mock_variant_id_en_other",
					match: ["other"],
					pattern: [
						{
							type: "expression",
							arg: {
								type: "variable",
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
	],
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
	},
}
