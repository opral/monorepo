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
	} satisfies BundleNested

	const result = await exportFiles({
		settings: mockSettings,
		bundles: [mockBundle],
	})

	expect(result).lengthOf(1)
	expect(result[0]?.path).toBe("/i18n/en.json")
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
	}

	const result = await exportFiles({
		settings: mockSettings,
		bundles: [mockBundle],
	})

	expect(result).lengthOf(1)
	expect(result[0]?.path).toBe("/i18n/en.json")
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
							{ type: "expression", arg: { type: "variable", name: "count" } },
							{ type: "text", value: " devs, " },
							{ type: "expression", arg: { type: "variable", name: "numDesigners" } },
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
	expect(result[0]?.path).toBe("/i18n/en.json")
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
	}

	const result = await exportFiles({
		settings: mockSettings,
		bundles: [mockBundle],
	})

	expect(result).lengthOf(2)
	expect(result).toStrictEqual([
		expect.objectContaining({
			locale: "en",
			path: "/i18n/en.json",
		}),
		expect.objectContaining({
			locale: "de",
			path: "/i18n/de.json",
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
