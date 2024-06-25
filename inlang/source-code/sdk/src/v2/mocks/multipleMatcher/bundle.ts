import type { MessageBundle } from "../../types/index.js"

export const multipleMatcherBundle: MessageBundle = {
	id: "mock-bundle-human-id",
	alias: {
		default: "mock-bundle-alias",
	},
	messages: [
		{
			id: "mock_message_id_en",
			locale: "en",
			declarations: [],
			selectors: [
				{
					type: "expression",
					arg: {
						type: "variable",
						name: "count",
					},
					annotation: { type: "function", name: "plural", options: [] },
				},
			],
			variants: [
				{
					id: "mock_variant_id_en_one",
					match: ["one"],
					pattern: [
						{
							type: "text",
							value: "Show ",
						},
						{
							type: "expression",
							arg: {
								type: "variable",
								name: "count",
							},
						},
						{
							type: "text",
							value: " message.",
						},
					],
				},
				{
					id: "mock_variant_id_en_many",
					match: ["many"],
					pattern: [
						{
							type: "text",
							value: "Show ",
						},
						{
							type: "expression",
							arg: {
								type: "variable",
								name: "count",
							},
						},
						{
							type: "text",
							value: " messages.",
						},
					],
				},
				{
					id: "mock_variant_id_en_default",
					match: ["*"],
					pattern: [
						{
							type: "text",
							value: "Show ",
						},
						{
							type: "expression",
							arg: {
								type: "variable",
								name: "count",
							},
						},
					],
				},
			],
		},
		{
			id: "mock_message_id_de",
			locale: "de",
			declarations: [],
			selectors: [
				{
					type: "expression",
					arg: {
						type: "variable",
						name: "count",
					},
					annotation: { type: "function", name: "plural", options: [] },
				},
				{
					type: "expression",
					arg: {
						type: "variable",
						name: "formal",
					},
					annotation: { type: "function", name: "bool", options: [] },
				},
			],
			variants: [
				{
					id: "mock_variant_id_de_one_formal",
					match: ["one", "formal"],
					pattern: [
						{
							type: "text",
							value: "Zeigen Sie bitte Ihre Nachricht.",
						},
					],
				},
				{
					id: "mock_variant_id_de_one_informal",
					match: ["one", "informal"],
					pattern: [
						{
							type: "text",
							value: "Zeigen Deine Nachricht.",
						},
					],
				},
				{
					id: "mock_variant_id_de_many_formal",
					match: ["many", "formal"],
					pattern: [
						{
							type: "text",
							value: "Zeigen Sie bitte Ihre ",
						},
						{
							type: "expression",
							arg: {
								type: "variable",
								name: "count",
							},
						},
						{
							type: "text",
							value: " Nachrichten.",
						},
					],
				},
				{
					id: "mock_variant_id_de_many_informal",
					match: ["many", "informal"],
					pattern: [
						{
							type: "text",
							value: "Zeigen Deine ",
						},
						{
							type: "expression",
							arg: {
								type: "variable",
								name: "count",
							},
						},
						{
							type: "text",
							value: " Nachrichten.",
						},
					],
				},
				{
					id: "mock_variant_id_de_many_default",
					match: ["many", "*"],
					pattern: [
						{
							type: "expression",
							arg: {
								type: "variable",
								name: "count",
							},
						},
						{
							type: "text",
							value: " Nachrichten zeigen.",
						},
					],
				},
				{
					id: "mock_variant_id_de_default",
					match: ["*"],
					pattern: [
						{
							type: "text",
							value: "Zeige ",
						},
						{
							type: "expression",
							arg: {
								type: "variable",
								name: "count",
							},
						},
					],
				},
			],
		},
	],
}
