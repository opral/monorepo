import type { MessageBundle } from "../../types.js"

export const multipleMatcherBundle: MessageBundle = {
	id: "mock-bundle-human-id",
	alias: {
		default: "mock-bundle-alias",
	},
	messages: [
		{
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
					match: ["one", "formal"],
					pattern: [
						{
							type: "text",
							value: "Zeigen Sie bitte Ihre Nachricht.",
						},
					],
				},
				{
					match: ["one", "informal"],
					pattern: [
						{
							type: "text",
							value: "Zeigen Deine Nachricht.",
						},
					],
				},
				{
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
