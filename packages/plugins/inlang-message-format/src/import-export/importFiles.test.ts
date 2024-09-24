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
				name: "en.json",
			},
		],
	})

	expect(result).toStrictEqual({
		bundles: [
			{
				id: "some_happy_cat",
				declarations: [],
				messages: [
					{
						id: "some_happy_cat_en",
						bundleId: "some_happy_cat",
						locale: "en",
						selectors: [],
						variants: [
							{
								id: "some_happy_cat_en",
								matches: [],
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
				name: "en.json",
			},
		],
	})

	expect(result).toStrictEqual({
		bundles: [
			{
				id: "some_happy_cat",
				declarations: [],
				messages: [
					{
						id: "some_happy_cat_en",
						bundleId: "some_happy_cat",
						locale: "en",
						selectors: [],
						variants: [
							{
								id: "some_happy_cat_en",
								matches: [],
								messageId: "some_happy_cat_en",
								pattern: [
									{ type: "text", value: "Used by " },
									{
										type: "expression",
										arg: { type: "variable-reference", name: "count" },
									},
									{
										type: "text",
										value: " devs, ",
									},
									{ type: "expression", arg: { type: "variable-reference", name: "numDesigners" } },
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
				name: "en.json",
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
				name: "en.json",
			},
			{
				locale: "de",
				content: mockDeFile,
				name: "de.json",
			},
		],
	})

	expect(result).toStrictEqual({
		bundles: [
			{
				id: "some_happy_cat",
				declarations: [],
				messages: [
					{
						id: "some_happy_cat_en",
						bundleId: "some_happy_cat",
						locale: "en",
						selectors: [],
						variants: [
							{
								id: "some_happy_cat_en",
								matches: [],
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
						variants: [
							{
								id: "some_happy_cat_de",
								matches: [],
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
				name: "en.json",
			},
		],
	})

	expect(result).toStrictEqual({
		bundles: [
			{
				id: "some_happy_cat",
				declarations: [],
				messages: [
					{
						id: "some_happy_cat_en",
						bundleId: "some_happy_cat",
						locale: "en",
						selectors: [],
						variants: [
							{
								id: "some_happy_cat_en;platform=android,userGender=male",
								matches: [
									{
										type: "literal-match",
										key: "platform",
										value: "android",
									},
									{
										type: "literal-match",
										key: "userGender",
										value: "male",
									},
								],
								messageId: "some_happy_cat_en",
								pattern: [
									{
										type: "expression",
										arg: { type: "variable-reference", name: "username" },
									},
									{
										type: "text",
										value: " has to download the app on his phone from the Google Play Store.",
									},
								],
							},
							{
								id: "some_happy_cat_en;platform=ios,userGender=female",
								matches: [
									{
										type: "literal-match",
										key: "platform",
										value: "ios",
									},
									{
										type: "literal-match",
										key: "userGender",
										value: "female",
									},
								],
								messageId: "some_happy_cat_en",
								pattern: [
									{
										type: "expression",
										arg: { type: "variable-reference", name: "username" },
									},
									{
										type: "text",
										value: " has to download the app on her iPhone from the App Store.",
									},
								],
							},
							{
								id: "some_happy_cat_en;platform=*,userGender=*",
								matches: [
									{
										type: "catchall-match",
										key: "platform",
									},
									{
										type: "catchall-match",
										key: "userGender",
									},
								],
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
