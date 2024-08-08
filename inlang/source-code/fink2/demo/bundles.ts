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
			{
				id: "message-bed-pelican-fridge",
				bundleId: "blue-bird-flower-dough",
				locale: "de",
				selectors: [],
				declarations: [],
				variants: [
					{
						id: "variant-table-owl-cup",
						messageId: "message-bed-pelican-fridge",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Hallo Welt",
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
			// {
			// 	id: "message-couch-panther-oven",
			// 	bundleId: "pink-tiger-leaf-frog",
			// 	locale: "de",
			// 	selectors: [],
			// 	declarations: [],
			// 	variants: [
			// 		{
			// 			id: "variant-chair-monkey-spoon",
			// 			messageId: "message-couch-panther-oven",
			// 			match: {},
			// 			pattern: [
			// 				{
			// 					type: "text",
			// 					value: "Das ist eine Beschreibung",
			// 				},
			// 			],
			// 		},
			// 	],
			// },
		],
	},
	{
		id: "green-fox-leaf-oven",
		alias: {
			default: "frontpage-cover-description",
		},
		messages: [
			{
				id: "message-green-fox-oven",
				bundleId: "green-fox-leaf-ovenh",
				locale: "en",
				selectors: [],
				declarations: [],
				variants: [
					{
						id: "variant-brown-fox-oven",
						messageId: "message-green-fox-oven",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Best deal for today",
							},
						],
					},
				],
			},
			{
				id: "message-tinted-crouton-oven",
				bundleId: "green-fox-leaf-oven",
				locale: "de",
				selectors: [],
				declarations: [],
				variants: [
					{
						id: "variant-tinted-silver-oven",
						messageId: "message-tinted-crouton-oven",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Bester Deal für heute",
							},
						],
					},
				],
			},
		],
	},
];
