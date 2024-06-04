import type { MessageBundle } from "../../types.js"

export const pluralBundle: MessageBundle = {
	id: "mock_bundle_human_id",
	alias: {
		default: "mock_bundle_alias",
	},
	messages: [
		{
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
					match: ["zero"],
					pattern: [
						{
							type: "text",
							value: "Keine Produkte",
						},
					],
				},
				{
					match: ["one"],
					pattern: [
						{
							type: "text",
							value: "Ein Produkt",
						},
					],
				},
				{
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
					match: ["zero"],
					pattern: [
						{
							type: "text",
							value: "No Products",
						},
					],
				},
				{
					match: ["one"],
					pattern: [
						{
							type: "text",
							value: "A product",
						},
					],
				},
				{
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
}
