import type { BundleNested, ProjectSettings } from "@inlang/sdk2"
import { test, expect } from "vitest"
import { PLUGIN_KEY } from "./plugin.js"
import type { PluginSettings } from "./settings.js"
import { importFiles } from "./import-export/importFiles.js"
import { exportFiles } from "./import-export/exportFiles.js"

test("roundtrip of import and export", async () => {
	const mockSettings: ProjectSettings = {
		baseLocale: "en",
		locales: ["en", "de"],
		[PLUGIN_KEY]: {
			pathPattern: "/i18n/{locale}.json",
		} satisfies PluginSettings,
	}

	const mockEnFileParsed = {
		some_happy_cat: "Read more about Lix",
		blue_horse_shoe: "Hello {username}, welcome to the {placename}!",
		jojo_mountain_day: {
			match: {
				"platform=android, userGender=male":
					"{username} has to download the app on his phone from the Google Play Store.",
				"platform=ios, userGender=female":
					"{username} has to download the app on her iPhone from the App Store.",
				"platform=*, userGender=*": "The person has to download the app.",
			},
		},
	}

	const imported = await importFiles({
		settings: mockSettings,
		files: [
			{
				content: new TextEncoder().encode(JSON.stringify(mockEnFileParsed)),
				locale: "en",
			},
		],
	})

	const exported = await exportFiles({
		settings: mockSettings,
		bundles: imported.bundles as BundleNested[],
	})

	expect(exported).lengthOf(1)
	expect(exported[0]?.name).toBe("en.json")
	expect(exported[0]?.locale).toBe("en")

	const parsed = JSON.parse(new TextDecoder().decode(exported[0]?.content))

	expect(parsed).toStrictEqual(mockEnFileParsed)
})

test("roundtrip with new variants that have been created by apps", async () => {
	const mockSettings: ProjectSettings = {
		baseLocale: "en",
		locales: ["en", "de"],
		[PLUGIN_KEY]: {
			pathPattern: "/i18n/{locale}.json",
		} satisfies PluginSettings,
	}

	const mockEnFileParsed = {
		some_happy_cat: "Read more about Lix",
	}

	const imported1 = await importFiles({
		settings: mockSettings,
		files: [
			{
				content: new TextEncoder().encode(JSON.stringify(mockEnFileParsed)),
				locale: "en",
			},
		],
	})

	// simulating adding a new bundle, message, and variant
	imported1.bundles.push({
		id: "green_box_atari",
		declarations: [],
		messages: [
			{
				id: "0j299j-3si02j0j4=s02-3js2",
				bundleId: "green_box_atari",
				selectors: [],
				locale: "en",
				variants: [
					{
						id: "929s",
						matches: [],
						messageId: "0j299j-3si02j0j4=s02-3js2",
						pattern: [{ type: "text", value: "New variant" }],
					},
				],
			},
		],
	})

	// export after adding the bundle, messages, variants
	const exported1 = await exportFiles({
		settings: mockSettings,
		bundles: imported1.bundles as BundleNested[],
	})

	const imported2 = await importFiles({
		settings: mockSettings,
		files: exported1,
	})

	const exported2 = await exportFiles({
		settings: mockSettings,
		bundles: imported2.bundles as BundleNested[],
	})

	expect(imported2.bundles).toStrictEqual([
		expect.objectContaining({
			id: "some_happy_cat",
		}),
		expect.objectContaining({
			id: "green_box_atari",
		}),
	])

	expect(exported2).toStrictEqual(exported1)
})
