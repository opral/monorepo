import { expect, test } from "vitest"
import { importFiles } from "./importFiles.js"
import type { BundleNested, LiteralMatch, Pattern, Variant } from "@inlang/sdk2"
import { exportFiles } from "./exportFiles.js"

test("single key value", async () => {
	const imported = await runImportFiles({
		key: "value",
	})
	expect(await runExportFiles(imported)).toStrictEqual({
		key: "value",
	})

	const bundle = imported.bundles.find((bundle) => bundle.id === "key")

	expect(bundle?.messages[0]?.variants[0]?.pattern).toStrictEqual([
		{ type: "text", value: "value" },
	])
})

test("key deep", async () => {
	const imported = await runImportFiles({
		keyDeep: {
			inner: "value",
		},
	})
	expect(await runExportFiles(imported)).toStrictEqual({
		keyDeep: {
			inner: "value",
		},
	})

	const bundle = imported.bundles.find((bundle) => bundle.id === "keyDeep.inner")
	expect(bundle?.messages[0]?.variants[0]?.pattern).toStrictEqual([
		{ type: "text", value: "value" },
	])
})

test("keyInterpolate", async () => {
	const imported = await runImportFiles({
		keyInterpolate: "replace this {{value}}",
	})
	expect(await runExportFiles(imported)).toStrictEqual({
		keyInterpolate: "replace this {{value}}",
	})

	const bundle = imported.bundles.find((bundle) => bundle.id === "keyInterpolate")

	expect(bundle?.declarations).toStrictEqual([
		{
			type: "input-variable",
			name: "value",
		},
	])

	expect(bundle?.messages[0]?.variants[0]?.pattern).toStrictEqual([
		{ type: "text", value: "replace this " },
		{
			type: "expression",
			arg: {
				type: "variable-reference",
				name: "value",
			},
		},
	] satisfies Pattern)
})

test("keyInterpolateUnescaped", async () => {
	const imported = await runImportFiles({
		keyInterpolateUnescaped: "replace this {{- value}}",
	})
	expect(await runExportFiles(imported)).toStrictEqual({
		keyInterpolateUnescaped: "replace this {{- value}}",
	})

	const bundle = imported.bundles.find((bundle) => bundle.id === "keyInterpolateUnescaped")
	expect(bundle?.declarations).toStrictEqual([
		{
			type: "input-variable",
			name: "- value",
		},
	])
	expect(bundle?.messages[0]?.variants[0]?.pattern).toStrictEqual([
		{ type: "text", value: "replace this " },
		{
			type: "expression",
			arg: {
				type: "variable-reference",
				name: "- value",
			},
		},
	] satisfies Pattern)
})

test("keyInterpolateWithFormatting", async () => {
	const imported = await runImportFiles({
		keyInterpolateWithFormatting: "replace this {{value, format}}",
	})
	expect(await runExportFiles(imported)).toStrictEqual({
		keyInterpolateWithFormatting: "replace this {{value, format}}",
	})

	const bundle = imported.bundles.find((bundle) => bundle.id === "keyInterpolateWithFormatting")
	expect(bundle?.messages[0]?.variants[0]?.pattern).toStrictEqual([
		{ type: "text", value: "replace this " },
		{
			type: "expression",
			arg: {
				type: "variable-reference",
				name: "value",
			},
			annotation: {
				type: "function-reference",
				name: "format",
				options: [],
			},
		},
	] satisfies Pattern)
})

test("keyContext", async () => {
	const imported = await runImportFiles({
		keyContext_male: "the male variant",
		keyContext_female: "the female variant",
	})
	expect(await runExportFiles(imported)).toStrictEqual({
		keyContext_male: "the male variant",
		keyContext_female: "the female variant",
	})

	const bundle = imported.bundles.find((bundle) => bundle.id === "keyContext")

	expect(bundle?.declarations).toStrictEqual([
		{
			type: "input-variable",
			name: "context",
		},
	])
	expect(bundle?.messages[0]?.variants[0]).toStrictEqual(
		expect.objectContaining({
			matches: [
				{
					type: "literal-match",
					key: "context",
					value: "male",
				},
			],
			pattern: [{ type: "text", value: "the male variant" }],
		} satisfies Partial<Variant>)
	)
	expect(bundle?.messages[0]?.variants[1]).toStrictEqual(
		expect.objectContaining({
			matches: [
				{
					type: "literal-match",
					key: "context",
					value: "female",
				},
			],
			pattern: [{ type: "text", value: "the female variant" }],
		} satisfies Partial<Variant>)
	)
})

test("keyPluralSimple", async () => {
	const imported = await runImportFiles({
		keyPluralSimple_one: "the singular",
		keyPluralSimple_other: "the plural",
	})
	expect(await runExportFiles(imported)).toStrictEqual({
		keyPluralSimple_one: "the singular",
		keyPluralSimple_other: "the plural",
	})

	const bundle = imported.bundles.find((bundle) => bundle.id === "keyPluralSimple")

	expect(bundle?.declarations).toStrictEqual(
		expect.arrayContaining([
			{
				type: "input-variable",
				name: "count",
			},
			expect.objectContaining({
				type: "local-variable",
				name: "countPlural",
				value: {
					type: "expression",
					arg: {
						type: "variable-reference",
						name: "count",
					},
					annotation: {
						type: "function-reference",
						name: "plural",
						options: [],
					},
				},
			}),
		])
	)

	expect(bundle?.messages[0]?.variants[0]).toStrictEqual(
		expect.objectContaining({
			matches: [
				{
					type: "literal-match",
					key: "countPlural",
					value: "one",
				},
			],
			pattern: [{ type: "text", value: "the singular" }],
		} satisfies Partial<Variant>)
	)

	expect(bundle?.messages[0]?.variants[1]).toStrictEqual(
		expect.objectContaining({
			matches: [
				{
					type: "literal-match",
					key: "countPlural",
					value: "other",
				},
			],
			pattern: [{ type: "text", value: "the plural" }],
		} satisfies Partial<Variant>)
	)
})

test("keyPluralMultipleEgArabic", async () => {
	const result = await runImportFiles({
		keyPluralMultipleEgArabic_zero: "the plural form 0",
		keyPluralMultipleEgArabic_one: "the plural form 1",
		keyPluralMultipleEgArabic_two: "the plural form 2",
		keyPluralMultipleEgArabic_few: "the plural form 3",
		keyPluralMultipleEgArabic_many: "the plural form 4",
		keyPluralMultipleEgArabic_other: "the plural form 5",
	})
	expect(await runExportFiles(result)).toStrictEqual({
		keyPluralMultipleEgArabic_zero: "the plural form 0",
		keyPluralMultipleEgArabic_one: "the plural form 1",
		keyPluralMultipleEgArabic_two: "the plural form 2",
		keyPluralMultipleEgArabic_few: "the plural form 3",
		keyPluralMultipleEgArabic_many: "the plural form 4",
		keyPluralMultipleEgArabic_other: "the plural form 5",
	})

	const bundle = result.bundles.find((bundle) => bundle.id === "keyPluralMultipleEgArabic")

	expect(bundle?.declarations).toStrictEqual(
		expect.arrayContaining([
			{
				type: "input-variable",
				name: "count",
			},
			expect.objectContaining({
				type: "local-variable",
				name: "countPlural",
				value: {
					type: "expression",
					arg: {
						type: "variable-reference",
						name: "count",
					},
					annotation: {
						type: "function-reference",
						name: "plural",
						options: [],
					},
				},
			}),
		])
	)

	const matches = bundle?.messages[0]?.variants.map(
		(variant) => (variant.matches?.[0] as LiteralMatch).value
	)
	expect(matches).toStrictEqual(["zero", "one", "two", "few", "many", "other"])
	expect(bundle?.messages[0]?.variants[0]?.pattern).toStrictEqual([
		{ type: "text", value: "the plural form 0" },
	])
	expect(bundle?.messages[0]?.variants[1]?.pattern).toStrictEqual([
		{ type: "text", value: "the plural form 1" },
	])
	expect(bundle?.messages[0]?.variants[2]?.pattern).toStrictEqual([
		{ type: "text", value: "the plural form 2" },
	])
	expect(bundle?.messages[0]?.variants[3]?.pattern).toStrictEqual([
		{ type: "text", value: "the plural form 3" },
	])
	expect(bundle?.messages[0]?.variants[4]?.pattern).toStrictEqual([
		{ type: "text", value: "the plural form 4" },
	])
	expect(bundle?.messages[0]?.variants[5]?.pattern).toStrictEqual([
		{ type: "text", value: "the plural form 5" },
	])
})

test("keyWithObjectValue", async () => {
	const imported = await runImportFiles({
		keyWithObjectValue: {
			valueA: "return this with valueB",
			valueB: "more text",
		},
	})
	expect(await runExportFiles(imported)).toStrictEqual({
		keyWithObjectValue: {
			valueA: "return this with valueB",
			valueB: "more text",
		},
	})

	const valueA = imported.bundles.find((bundle) => bundle.id === "keyWithObjectValue.valueA")
	const valueB = imported.bundles.find((bundle) => bundle.id === "keyWithObjectValue.valueB")

	expect(valueA?.messages[0]?.variants[0]?.pattern).toStrictEqual([
		{ type: "text", value: "return this with valueB" },
	] satisfies Pattern)
	expect(valueB?.messages[0]?.variants[0]?.pattern).toStrictEqual([
		{ type: "text", value: "more text" },
	] satisfies Pattern)
})

test("keyWithArrayValue", async () => {
	const imported = await runImportFiles({
		keyWithArrayValue: ["multiple", "things"],
	})
	expect(await runExportFiles(imported)).toStrictEqual({
		keyWithArrayValue: ["multiple", "things"],
	})

	const bundle1 = imported.bundles.find((bundle) => bundle.id === "keyWithArrayValue.0")
	const bundle2 = imported.bundles.find((bundle) => bundle.id === "keyWithArrayValue.1")

	expect(bundle1?.messages[0]?.variants[0]?.pattern).toStrictEqual([
		{ type: "text", value: "multiple" },
	] satisfies Pattern)
	expect(bundle2?.messages[0]?.variants[0]?.pattern).toStrictEqual([
		{ type: "text", value: "things" },
	] satisfies Pattern)
})

test("im- and exporting multiple files should succeed", async () => {
	const en = {
		key: "value",
	}
	const de = {
		key: "Wert",
	}

	const imported = await importFiles({
		settings: {} as any,
		files: [
			{
				locale: "en",
				content: new TextEncoder().encode(JSON.stringify(en)),
				path: "mock/en.json",
			},
			{
				locale: "de",
				content: new TextEncoder().encode(JSON.stringify(de)),
				path: "mock/de.json",
			},
		],
	})
	const exported = await exportFiles({
		settings: {} as any,
		bundles: imported.bundles as BundleNested[],
	})
	const exportedEn = JSON.parse(
		new TextDecoder().decode(exported.find((e) => e.locale === "en")?.content)
	)
	const exportedDe = JSON.parse(
		new TextDecoder().decode(exported.find((e) => e.locale === "de")?.content)
	)

	expect(exportedEn).toStrictEqual({
		key: "value",
	})
	expect(exportedDe).toStrictEqual({
		key: "Wert",
	})
})

test("it should handle namespaces", async () => {
	const enCommon = {
		confirm: "value1",
	}
	const enLogin = {
		button: "value2",
	}

	const imported = await importFiles({
		settings: {} as any,
		files: [
			{
				locale: "en",
				content: new TextEncoder().encode(JSON.stringify(enCommon)),
				path: "common/en.json",
				toBeImportedFilesMetadata: {
					namespace: "common",
				},
			},
			{
				locale: "en",
				content: new TextEncoder().encode(JSON.stringify(enLogin)),
				path: "login/en.json",
				toBeImportedFilesMetadata: {
					namespace: "login",
				},
			},
		],
	})
	const exported = await exportFiles({
		settings: {} as any,
		bundles: imported.bundles as BundleNested[],
	})
	const exportedCommon = JSON.parse(
		new TextDecoder().decode(exported.find((e) => e.path.includes("common"))?.content)
	)
	const exportedLogin = JSON.parse(
		new TextDecoder().decode(exported.find((e) => e.path.includes("login"))?.content)
	)

	expect(exportedCommon).toStrictEqual({
		confirm: "value1",
	})
	expect(exportedLogin).toStrictEqual({
		button: "value2",
	})
})

test("it should put new entities into the resource file without a namespace", async () => {
	const enNoNamespace = {
		blue_box: "value1",
	}

	const enCommon = {
		foo_bar: "value2",
	}

	const imported = await importFiles({
		settings: {} as any,
		files: [
			{
				locale: "en",
				content: new TextEncoder().encode(JSON.stringify(enNoNamespace)),
				path: "en.json",
			},
			{
				locale: "en",
				content: new TextEncoder().encode(JSON.stringify(enCommon)),
				path: "common-en.json",
				toBeImportedFilesMetadata: {
					namespace: "common",
				},
			},
		],
	})

	const newBundle: BundleNested = {
		id: "happy_elephant",
		declarations: [],
		messages: [
			{
				id: "happy_elephant_en",
				bundleId: "happy_elephant",
				locale: "en",
				selectors: [],
				variants: [
					{
						id: "happy_elephant_en_*",
						matches: [],
						messageId: "happy_elephant_en",
						pattern: [{ type: "text", value: "elephant" }],
					},
				],
			},
		],
	}

	const exported = await exportFiles({
		settings: {} as any,
		bundles: [...(imported.bundles as BundleNested[]), newBundle],
	})

	const exportedNoNamespace = JSON.parse(
		new TextDecoder().decode(exported.find((e) => e.path.includes("en.json"))?.content)
	)

	const exportedCommon = JSON.parse(
		new TextDecoder().decode(exported.find((e) => e.path.includes("common"))?.content)
	)

	expect(exportedNoNamespace).toStrictEqual({
		blue_box: "value1",
		happy_elephant: "elephant",
	})

	expect(exportedCommon).toStrictEqual({
		foo_bar: "value2",
	})
})

// convenience wrapper for less testing code
function runImportFiles(json: Record<string, any>) {
	return importFiles({
		settings: {} as any,
		files: [
			{
				locale: "en",
				content: new TextEncoder().encode(JSON.stringify(json)),
				path: "mock/en.json",
			},
		],
	})
}

// convenience wrapper for less testing code
async function runExportFiles(imported: Awaited<ReturnType<typeof runImportFiles>>) {
	const exported = await exportFiles({
		settings: {} as any,
		bundles: imported.bundles as BundleNested[],
	})
	return JSON.parse(new TextDecoder().decode(exported[0]?.content))
}
