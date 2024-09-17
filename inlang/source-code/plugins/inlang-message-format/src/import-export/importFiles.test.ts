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

test("it handles variable expressions ins patterns", async () => {
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
