import { BundleNested } from "@inlang/sdk2";

export const demoBundles: BundleNested[] = [
	{
		id: "blue-bird-flower-dough",
		alias: {
			default: "frontpage-cover-title",
		},
		messages: [
			{
				id: "message-teal-zebra-sun",
				bundleId: "blue-bird-flower-dough",
				locale: "en",
				selectors: [],
				declarations: [],
				variants: [
					{
						id: "variant-red-building-wood",
						messageId: "message-teal-zebra-sun",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Hello world",
							},
						],
					},
				],
			},
		],
	},
	{
		id: "pink-tiger-leaf-frog",
		alias: {
			default: "frontpage-cover-description",
		},
		messages: [
			{
				id: "message-orange-gnu-rainbow",
				bundleId: "blue-bird-flower-dough",
				locale: "en",
				selectors: [],
				declarations: [],
				variants: [
					{
						id: "variant-yellow-iguana-leaf",
						messageId: "message-orange-gnu-rainbow",
						match: {},
						pattern: [
							{
								type: "text",
								value: "This is a description",
							},
						],
					},
				],
			},
		],
	},
];
