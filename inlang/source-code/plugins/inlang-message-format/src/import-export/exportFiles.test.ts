import type { BundleNested, ProjectSettings } from "@inlang/sdk2"
import { expect, test } from "vitest"
import { PLUGIN_KEY } from "../plugin.js"
import type { PluginSettings } from "../settings.js"
import { exportFiles } from "./exportFiles.js"

test("it handles single variants without expressions", async () => {
	const mockSettings: ProjectSettings = {
		baseLocale: "en",
		locales: ["en", "de"],
		[PLUGIN_KEY]: {
			pathPattern: "/i18n/{locale}.json",
		} satisfies PluginSettings,
	}

	const mockEnFile = {
		some_happy_cat: "Read more about Lix",
	}

	const mockBundle = {
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
	} satisfies BundleNested

	const result = await exportFiles({
		settings: mockSettings,
		bundles: [mockBundle],
	})

	expect(result).lengthOf(1)
	expect(result[0]?.name).toBe("en.json")
	expect(result[0]?.locale).toBe("en")

	const parsed = JSON.parse(new TextDecoder().decode(result[0]?.content))

	expect(parsed).toStrictEqual(mockEnFile)
})

test("it handles multi variants", async () => {
	const mockSettings: ProjectSettings = {
		baseLocale: "en",
		locales: ["en", "de"],
		[PLUGIN_KEY]: {
			pathPattern: "/i18n/{locale}.json",
		} satisfies PluginSettings,
	}

	const mockEnFile = {
		some_happy_cat: {
			match: {
				"platform=android, userGender=male":
					"{username} has to download the app on his phone from the Google Play Store.",
				"platform=ios, userGender=female":
					"{username} has to download the app on her iPhone from the App Store.",
				"platform=*, userGender=*": "The person has to download the app.",
			},
		},
	}

	const mockBundle: BundleNested = {
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
	}

	const result = await exportFiles({
		settings: mockSettings,
		bundles: [mockBundle],
	})

	expect(result).lengthOf(1)
	expect(result[0]?.name).toBe("en.json")
	expect(result[0]?.locale).toBe("en")

	const parsed = JSON.parse(new TextDecoder().decode(result[0]?.content))

	expect(parsed).toStrictEqual(mockEnFile)
})

test("it handles variable expressions in patterns", async () => {
	const mockSettings: ProjectSettings = {
		baseLocale: "en",
		locales: ["en", "de"],
		[PLUGIN_KEY]: {
			pathPattern: "/i18n/{locale}.json",
		} satisfies PluginSettings,
	}

	const mockEnFile = {
		some_happy_cat: "Used by {count} devs, {numDesigners} designers and translators",
	}

	const mockBundle = {
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
							{ type: "expression", arg: { type: "variable-reference", name: "count" } },
							{ type: "text", value: " devs, " },
							{ type: "expression", arg: { type: "variable-reference", name: "numDesigners" } },
							{ type: "text", value: " designers and translators" },
						],
					},
				],
			},
		],
	} satisfies BundleNested

	const result = await exportFiles({
		settings: mockSettings,
		bundles: [mockBundle],
	})

	expect(result).lengthOf(1)
	expect(result[0]?.name).toBe("en.json")
	expect(result[0]?.locale).toBe("en")

	const parsed = JSON.parse(new TextDecoder().decode(result[0]?.content))

	expect(parsed).toStrictEqual(mockEnFile)
})

test("it assigns the correct locales to files", async () => {
	const mockSettings: ProjectSettings = {
		baseLocale: "en",
		locales: ["en", "de"],
		[PLUGIN_KEY]: {
			pathPattern: "/i18n/{locale}.json",
		} satisfies PluginSettings,
	}

	const mockBundle: BundleNested = {
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
	}

	const result = await exportFiles({
		settings: mockSettings,
		bundles: [mockBundle],
	})

	expect(result).lengthOf(2)
	expect(result).toStrictEqual([
		expect.objectContaining({
			locale: "en",
			name: "en.json",
		}),
		expect.objectContaining({
			locale: "de",
			name: "de.json",
		}),
	])
})

test("it should throw if pathPattern is not defined because no export is possible", async () => {
	const mockSettings: ProjectSettings = {
		baseLocale: "en",
		locales: ["en", "de"],
		[PLUGIN_KEY]: {},
	}

	await expect(
		exportFiles({
			settings: mockSettings,
			bundles: [],
		})
	).rejects.toThrow("pathPattern is not defined")
})
