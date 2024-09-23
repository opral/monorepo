import { describe, expect, test } from "vitest"
import { importFiles } from "./importFiles.js"
import { PLUGIN_KEY } from "../plugin.js"

// https://www.i18next.com/misc/json-format#i18next-json-v4
describe("it should be able to import the i18next JSON v4", async () => {
	const mockSettings = {
		baseLocale: "en",
		locales: ["en", "de"],
		[PLUGIN_KEY]: {
			pathPattern: "mock/{locale}.json",
		},
	}

	const mockEnResource = {
		key: "value",
		keyDeep: {
			inner: "value",
		},
		keyNesting: "reuse $t(keyDeep.inner)",
		keyInterpolate: "replace this {{value}}",
		keyInterpolateUnescaped: "replace this {{- value}}",
		keyInterpolateWithFormatting: "replace this {{value, format}}",
		keyContext_male: "the male variant",
		keyContext_female: "the female variant",
		keyPluralSimple_one: "the singular",
		keyPluralSimple_other: "the plural",
		keyPluralMultipleEgArabic_zero: "the plural form 0",
		keyPluralMultipleEgArabic_one: "the plural form 1",
		keyPluralMultipleEgArabic_two: "the plural form 2",
		keyPluralMultipleEgArabic_few: "the plural form 3",
		keyPluralMultipleEgArabic_many: "the plural form 4",
		keyPluralMultipleEgArabic_other: "the plural form 5",
		keyWithObjectValue: { valueA: "return this with valueB", valueB: "more text" },
	}

	const mockEnFile = new TextEncoder().encode(JSON.stringify(mockEnResource))

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

	test("single key value", () => {
		const bundle = result.bundles.find((bundle) => bundle.id === "key")
		expect(bundle).toStrictEqual(expect.objectContaining({ id: "key" }))
	})

	test("key deep", () => {
		const bundle = result.bundles.find((bundle) => bundle.id === "keyDeep.inner")
		expect(bundle).toStrictEqual(expect.objectContaining({ id: "keyDeep.inner" }))
	})
})
