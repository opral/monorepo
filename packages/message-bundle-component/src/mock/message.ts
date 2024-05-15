import type { MessageBundle } from "@inlang/sdk/v2"

export const mockMessageBundle: MessageBundle = {
	id: "mock-bundle-human-id",
	alias: {
		default: "mock-bundle-alias",
	},
	messages: [
		{
			locale: "en",
			declarations: [
				{
					type: "input",
					name: "username",
					value: {
						type: "expression",
						arg: {
							type: "variable",
							name: "username",
						},
					},
				},
			],
			selectors: [
				{
					type: "expression",
					arg: {
						type: "variable",
						name: "count",
					},
				},
			],
			variants: [
				{
					match: ["one"],
					pattern: [
						{
							type: "text",
							value: "Show {count} message.",
						},
					],
				},
				{
					match: ["many"],
					pattern: [
						{
							type: "text",
							value: "Show {count} messages.",
						},
					],
				},
				{
					match: ["*"],
					pattern: [
						{
							type: "text",
							value: "Show {count}",
						},
					],
				},
			],
		},
		{
			locale: "de",
			declarations: [
				{
					type: "input",
					name: "username",
					value: {
						type: "expression",
						arg: {
							type: "variable",
							name: "username",
						},
					},
				},
			],
			selectors: [
				{
					type: "expression",
					arg: {
						type: "variable",
						name: "count",
					},
				},
				{
					type: "expression",
					arg: {
						type: "variable",
						name: "bool",
					},
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
							value: "Zeigen Sie bitte Ihre {count} Nachrichten.",
						},
					],
				},
				{
					match: ["many", "informal"],
					pattern: [
						{
							type: "text",
							value: "Zeigen Deine {count} Nachrichten.",
						},
					],
				},
				{
					match: ["many", "*"],
					pattern: [
						{
							type: "text",
							value: "{count} Nachrichten zeigen.",
						},
					],
				},
				{
					match: ["*"],
					pattern: [
						{
							type: "text",
							value: "Zeige {count}",
						},
					],
				},
			],
		},
	],
}
