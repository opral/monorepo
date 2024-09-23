import { expect, test } from "vitest"
import { importFiles } from "./importFiles.js"
import type { LiteralMatch, Pattern, Variant } from "@inlang/sdk2"

test("single key value", async () => {
	const result = await runImportFiles({
		key: "value",
	})
	const bundle = result.bundles.find((bundle) => bundle.id === "key")
	expect(bundle?.messages[0]?.variants[0]?.pattern).toStrictEqual([
		{ type: "text", value: "value" },
	])
})

test("key deep", async () => {
	const result = await runImportFiles({
		keyDeep: {
			inner: "value",
		},
	})
	const bundle = result.bundles.find((bundle) => bundle.id === "keyDeep.inner")
	expect(bundle?.messages[0]?.variants[0]?.pattern).toStrictEqual([
		{ type: "text", value: "value" },
	])
})

test("keyInterpolate", async () => {
	const result = await runImportFiles({
		keyInterpolate: "replace this {{value}}",
	})
	const bundle = result.bundles.find((bundle) => bundle.id === "keyInterpolate")

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
	const result = await runImportFiles({
		keyInterpolateUnescaped: "replace this {{- value}}",
	})

	const bundle = result.bundles.find((bundle) => bundle.id === "keyInterpolateUnescaped")
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
	const result = await runImportFiles({
		keyInterpolateWithFormatting: "replace this {{value, format}}",
	})

	const bundle = result.bundles.find((bundle) => bundle.id === "keyInterpolateWithFormatting")
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
	const result = await runImportFiles({
		keyContext_male: "the male variant",
		keyContext_female: "the female variant",
	})

	const bundle = result.bundles.find((bundle) => bundle.id === "keyContext")

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
	const result = await runImportFiles({
		keyPluralSimple_one: "the singular",
		keyPluralSimple_other: "the plural",
	})

	const bundle = result.bundles.find((bundle) => bundle.id === "keyPluralSimple")

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
	const result = await runImportFiles({
		keyWithObjectValue: {
			valueA: "return this with valueB",
			valueB: "more text",
		},
	})
	const valueA = result.bundles.find((bundle) => bundle.id === "keyWithObjectValue.valueA")
	const valueB = result.bundles.find((bundle) => bundle.id === "keyWithObjectValue.valueB")

	expect(valueA?.messages[0]?.variants[0]?.pattern).toStrictEqual([
		{ type: "text", value: "return this with valueB" },
	] satisfies Pattern)
	expect(valueB?.messages[0]?.variants[0]?.pattern).toStrictEqual([
		{ type: "text", value: "more text" },
	] satisfies Pattern)
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
