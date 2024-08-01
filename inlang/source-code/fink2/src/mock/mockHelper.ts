import { NestedBundle } from "@inlang/sdk2";

export const mockBundle = {
	id: "mock-bundle-id",
	alias: {
		default: "mock-bundle-alias",
	},
	messages: [
		{
			id: "mock-message-id",
			bundleId: "mock-bundle-id",
			locale: "en-US",
			declarations: [
				{
					name: "name",
					value: {
						type: "text",
						value: "name",
					},
				},
			],
			selectors: [
				{
					type: "plural",
					arg: {
						name: "count",
					},
				},
			],
			variants: [
				{
					id: "mock-variant-id",
					messageId: "mock-message-id",
					match: {
						count: "one",
					},
					pattern: [
						{
							type: "text",
							value: "one name",
						},
					],
				},
				{
					id: "mock-variant-id",
					messageId: "mock-message-id",
					match: {
						count: "other",
					},
					pattern: [
						{
							type: "text",
							value: "other name",
						},
					],
				},
			],
		},
	],
} as NestedBundle;
