import type { BundleNested, ProjectSettings } from "@inlang/sdk2"
import { expect, test } from "vitest"
import { importFiles } from "./importFiles.js"

test("it handles single variants without expressions", async () => {
	const mockSettings: ProjectSettings = {
		baseLocale: "en",
		locales: ["en", "de"],
	}

	const mockEnFile = new TextEncoder().encode(
		JSON.stringify({
			some_happy_cat: "Read more about Lix",
		})
	)

	const result = await importFiles({
		settings: mockSettings,
		files: [
			{
				locale: "en",
				content: mockEnFile,
				path: "mock/en.json",
			},
		],
	})

	expect(result).toStrictEqual({
		bundles: [
			{
				id: "some_happy_cat",
				alias: {},
				messages: [
					{
						id: "some_happy_cat_en",
						bundleId: "some_happy_cat",
						locale: "en",
						selectors: [],
						declarations: [],
						variants: [
							{
								id: "some_happy_cat_en",
								match: {},
								messageId: "some_happy_cat_en",
								pattern: [{ type: "text", value: "Read more about Lix" }],
							},
						],
					},
				],
			},
		] satisfies BundleNested[],
	})
})

test("it handles variable expressions in patterns", async () => {
	const mockSettings: ProjectSettings = {
		baseLocale: "en",
		locales: ["en", "de"],
	}

	const mockEnFile = new TextEncoder().encode(
		JSON.stringify({
			some_happy_cat: "Used by {count} devs, {numDesigners} designers and translators",
		})
	)

	const result = await importFiles({
		settings: mockSettings,
		files: [
			{
				locale: "en",
				content: mockEnFile,
				path: "mock/en.json",
			},
		],
	})

	expect(result).toStrictEqual({
		bundles: [
			{
				id: "some_happy_cat",
				alias: {},
				messages: [
					{
						id: "some_happy_cat_en",
						bundleId: "some_happy_cat",
						locale: "en",
						selectors: [],
						declarations: [],
						variants: [
							{
								id: "some_happy_cat_en",
								match: {},
								messageId: "some_happy_cat_en",
								pattern: [
									{ type: "text", value: "Used by " },
									{
										type: "expression",
										arg: { type: "variable", name: "count" },
									},
									{
										type: "text",
										value: " devs, ",
									},
									{ type: "expression", arg: { type: "variable", name: "numDesigners" } },
									{
										type: "text",
										value: " designers and translators",
									},
								],
							},
						],
					},
				],
			},
		] satisfies BundleNested[],
	})
})

test("it ingores the $schema property that is used for typesafety", async () => {
	const mockSettings: ProjectSettings = {
		baseLocale: "en",
		locales: ["en", "de"],
	}

	const mockEnFile = new TextEncoder().encode(
		JSON.stringify({
			$schema: "https://mock.com/file-schema",
		})
	)

	const result = await importFiles({
		settings: mockSettings,
		files: [
			{
				locale: "en",
				content: mockEnFile,
				path: "mock/en.json",
			},
		],
	})

	expect(result).toStrictEqual({
		bundles: [],
	})
})

test("it assigns the correct locales to messages", async () => {
	const mockSettings: ProjectSettings = {
		baseLocale: "en",
		locales: ["en", "de"],
	}

	const mockEnFile = new TextEncoder().encode(
		JSON.stringify({
			some_happy_cat: "Read more about Lix",
		})
	)

	const mockDeFile = new TextEncoder().encode(
		JSON.stringify({
			some_happy_cat: "Lese mehr über Lix",
		})
	)

	const result = await importFiles({
		settings: mockSettings,
		files: [
			{
				locale: "en",
				content: mockEnFile,
				path: "mock/en.json",
			},
			{
				locale: "de",
				content: mockDeFile,
				path: "mock/de.json",
			},
		],
	})

	expect(result).toStrictEqual({
		bundles: [
			{
				id: "some_happy_cat",
				alias: {},
				messages: [
					{
						id: "some_happy_cat_en",
						bundleId: "some_happy_cat",
						locale: "en",
						selectors: [],
						declarations: [],
						variants: [
							{
								id: "some_happy_cat_en",
								match: {},
								messageId: "some_happy_cat_en",
								pattern: [{ type: "text", value: "Read more about Lix" }],
							},
						],
					},
					{
						id: "some_happy_cat_de",
						bundleId: "some_happy_cat",
						locale: "de",
						selectors: [],
						declarations: [],
						variants: [
							{
								id: "some_happy_cat_de",
								match: {},
								messageId: "some_happy_cat_de",
								pattern: [{ type: "text", value: "Lese mehr über Lix" }],
							},
						],
					},
				],
			},
		] satisfies BundleNested[],
	})
})

test("it handles multi variant messages", async () => {
	const mockSettings: ProjectSettings = {
		baseLocale: "en",
		locales: ["en", "de"],
	}

	const mockEnFile = new TextEncoder().encode(
		JSON.stringify({
			some_happy_cat: {
				match: {
					"platform=android, userGender=male":
						"{username} has to download the app on his phone from the Google Play Store.",
					"platform=ios, userGender=female":
						"{username} has to download the app on her iPhone from the App Store.",
					"platform=*, userGender=*": "The person has to download the app.",
				},
			},
		})
	)

	const result = await importFiles({
		settings: mockSettings,
		files: [
			{
				locale: "en",
				content: mockEnFile,
				path: "mock/en.json",
			},
		],
	})

	expect(result).toStrictEqual({
		bundles: [
			{
				id: "some_happy_cat",
				alias: {},
				messages: [
					{
						id: "some_happy_cat_en",
						bundleId: "some_happy_cat",
						locale: "en",
						selectors: [],
						declarations: [],
						variants: [
							{
								id: "some_happy_cat_en;platform=android,userGender=male",
								match: {
									platform: "android",
									userGender: "male",
								},
								messageId: "some_happy_cat_en",
								pattern: [
									{
										type: "expression",
										arg: { type: "variable", name: "username" },
									},
									{
										type: "text",
										value: " has to download the app on his phone from the Google Play Store.",
									},
								],
							},
							{
								id: "some_happy_cat_en;platform=ios,userGender=female",
								match: {
									platform: "ios",
									userGender: "female",
								},
								messageId: "some_happy_cat_en",
								pattern: [
									{
										type: "expression",
										arg: { type: "variable", name: "username" },
									},
									{
										type: "text",
										value: " has to download the app on her iPhone from the App Store.",
									},
								],
							},
							{
								id: "some_happy_cat_en;platform=*,userGender=*",
								match: {
									platform: "*",
									userGender: "*",
								},
								messageId: "some_happy_cat_en",
								pattern: [
									{
										type: "text",
										value: "The person has to download the app.",
									},
								],
							},
						],
					},
				],
			},
		] satisfies BundleNested[],
	})
})

// test.todo("it parses multi variants", async () => {
// 	const mockFile: FileSchema = {
// 		some_happy_cat: {
// 			selectors: {
// 				count: "plural(count)",
// 			},
// 			match: {
// 				"count=one": "You have one photo.",
// 				"count=other": "You have {count} photos.",
// 			},
// 		},
// 		multi_selector: {
// 			"plural(photoCount)=other, plural(likeCount)=one": "You have one photo and one like.",
// 			"plural(photoCount)=one, plural(likeCount)=one": "You have one photo and one like.",
// 		},
// 	}

// const result = parseFile({
// 	locale: "en",
// 	content: new TextEncoder().encode(JSON.stringify(mockFile)),
// })

// expect(result).toStrictEqual([
// 	{
// 		id: "some_happy_cat_en",
// 		bundleId: "some_happy_cat",
// 		locale: "en",
// 		selectors: [],
// 		declarations: [],
// 		variants: [
// 			{
// 				id: "some_happy_cat_en",
// 				match: {},
// 				messageId: "some_happy_cat_en",
// 				pattern: [
// 					{ type: "text", value: "Used by " },
// 					{
// 						type: "expression",
// 						arg: { type: "variable", name: "count" },
// 					},
// 					{
// 						type: "text",
// 						value: " devs, ",
// 					},
// 					{ type: "expression", arg: { type: "variable", name: "numDesigners" } },
// 					{
// 						type: "text",
// 						value: " designers and translators",
// 					},
// 				],
// 			},
// 		],
// 	},
// ] satisfies MessageNested[])
// })
//
