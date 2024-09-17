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
	}

	const imported = await importFiles({
		settings: mockSettings,
		files: [
			{
				content: new TextEncoder().encode(JSON.stringify(mockEnFileParsed)),
				locale: "en",
				path: "/i18n/en.json",
			},
		],
	})

	const exported = await exportFiles({
		settings: mockSettings,
		bundles: imported.bundles as BundleNested[],
	})

	expect(exported).lengthOf(1)
	expect(exported[0]?.path).toBe("/i18n/en.json")
	expect(exported[0]?.locale).toBe("en")

	const parsed = JSON.parse(new TextDecoder().decode(exported[0]?.content))

	expect(parsed).toStrictEqual(mockEnFileParsed)
})
