import { expect, test } from "vitest";
import { importFiles } from "./importFiles.js";
import {
  type Bundle,
  type LiteralMatch,
  type Message,
  type Pattern,
  type Variant,
} from "@inlang/sdk";
import { exportFiles } from "./exportFiles.js";
import type { PluginSettings } from "../settings.js";

test("single key value", async () => {
	const imported = await runImportFiles({
		key: "value",
	});
	expect(await runExportFilesParsed(imported)).toStrictEqual({
		key: "value",
	});

	expect(imported.bundles).lengthOf(1);
	expect(imported.messages).lengthOf(1);
	expect(imported.variants).lengthOf(1);

	expect(imported.bundles[0]?.id).toStrictEqual("key");
	expect(imported.bundles[0]?.declarations).toStrictEqual([]);
	expect(imported.messages[0]?.selectors).toStrictEqual([]);
	expect(imported.variants[0]?.matches).toStrictEqual([]);
	expect(imported.variants[0]?.pattern).toStrictEqual([
		{ type: "text", value: "value" },
	]);
});

test("key deep", async () => {
	const imported = await runImportFiles({
		keyDeep: { inner: "value" },
	});
	expect(await runExportFilesParsed(imported)).toStrictEqual({
		keyDeep: { inner: "value" },
	});

	expect(imported.bundles).lengthOf(1);
	expect(imported.messages).lengthOf(1);
	expect(imported.variants).lengthOf(1);

	expect(imported.bundles[0]?.id).toStrictEqual("keyDeep.inner");
	expect(imported.variants[0]?.pattern).toStrictEqual([
		{ type: "text", value: "value" },
	]);
});

test("keyInterpolate", async () => {
	const imported = await runImportFiles({
		keyInterpolate: "replace this {{value}}",
	});
	expect(await runExportFilesParsed(imported)).toStrictEqual({
		keyInterpolate: "replace this {{value}}",
	});

	expect(imported.bundles).lengthOf(1);
	expect(imported.messages).lengthOf(1);
	expect(imported.variants).lengthOf(1);

	expect(imported.bundles[0]?.declarations).toStrictEqual([
		{ type: "input-variable", name: "value" },
	]);

	expect(imported.variants[0]?.pattern).toStrictEqual([
		{ type: "text", value: "replace this " },
		{ type: "expression", arg: { type: "variable-reference", name: "value" } },
	] satisfies Pattern);
});

test("keyInterpolateUnescaped", async () => {
	const imported = await runImportFiles({
		keyInterpolateUnescaped: "replace this {{- value}}",
	});
	expect(await runExportFilesParsed(imported)).toStrictEqual({
		keyInterpolateUnescaped: "replace this {{- value}}",
	});

	expect(imported.bundles[0]?.id).toStrictEqual("keyInterpolateUnescaped");
	expect(imported.bundles[0]?.declarations).toStrictEqual([
		{ type: "input-variable", name: "- value" },
	]);
	expect(imported.variants[0]?.pattern).toStrictEqual([
		{ type: "text", value: "replace this " },
		{
			type: "expression",
			arg: { type: "variable-reference", name: "- value" },
		},
	] satisfies Pattern);
});

test("keyInterpolateWithFormatting", async () => {
	const imported = await runImportFiles({
		keyInterpolateWithFormatting: "replace this {{value, format}}",
	});
	expect(await runExportFilesParsed(imported)).toStrictEqual({
		keyInterpolateWithFormatting: "replace this {{value, format}}",
	});

	expect(imported.bundles[0]?.id).toStrictEqual("keyInterpolateWithFormatting");
	expect(imported.variants[0]?.pattern).toStrictEqual([
		{ type: "text", value: "replace this " },
		{
			type: "expression",
			arg: { type: "variable-reference", name: "value" },
			annotation: { type: "function-reference", name: "format", options: [] },
		},
	] satisfies Pattern);
});

test.todo("keyContext", async () => {
	const imported = await runImportFiles({
		// catch all
		keyContext: "the variant",
		// context: male
		keyContext_male: "the male variant",
		// context: female
		keyContext_female: "the female variant",
	});
	expect(await runExportFilesParsed(imported)).toStrictEqual({
		keyContext: "the variant",
		keyContext_male: "the male variant",
		keyContext_female: "the female variant",
	});

	expect(imported.bundles).lengthOf(1);
	expect(imported.messages).lengthOf(1);
	expect(imported.variants).lengthOf(3);

	expect(imported.bundles[0]?.id).toStrictEqual("keyContext");
	expect(imported.bundles[0]?.declarations).toStrictEqual([
		{ type: "input-variable", name: "context" },
	]);
	expect(imported?.messages[0]?.selectors).toStrictEqual([
		{ type: "variable-reference", name: "context" },
	]);
	expect(imported.variants[0]).toStrictEqual(
		expect.objectContaining({
			matches: [{ type: "catchall-match", key: "context" }],
			pattern: [{ type: "text", value: "the variant" }],
		} satisfies Partial<Variant>)
	);
	expect(imported.variants[1]).toStrictEqual(
		expect.objectContaining({
			matches: [{ type: "literal-match", key: "context", value: "male" }],
			pattern: [{ type: "text", value: "the male variant" }],
		} satisfies Partial<Variant>)
	);
	expect(imported.variants[2]).toStrictEqual(
		expect.objectContaining({
			matches: [{ type: "literal-match", key: "context", value: "female" }],
			pattern: [{ type: "text", value: "the female variant" }],
		} satisfies Partial<Variant>)
	);
});

test("keyPluralSimple", async () => {
	const imported = await runImportFiles({
		keyPluralSimple_one: "the singular",
		keyPluralSimple_other: "the plural",
	});
	expect(await runExportFilesParsed(imported)).toStrictEqual({
		keyPluralSimple_one: "the singular",
		keyPluralSimple_other: "the plural",
	});

	expect(imported.bundles[0]?.id).toStrictEqual("keyPluralSimple");

	expect(imported.bundles[0]?.declarations).toStrictEqual(
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
	);

	expect(imported?.messages[0]?.selectors).toStrictEqual([
		{
			type: "variable-reference",
			name: "countPlural",
		},
	]);

	expect(imported?.variants[0]).toStrictEqual(
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
	);

	expect(imported?.variants[1]).toStrictEqual(
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
	);
});

test("keyPluralMultipleEgArabic", async () => {
	const imported = await runImportFiles({
		keyPluralMultipleEgArabic_zero: "the plural form 0",
		keyPluralMultipleEgArabic_one: "the plural form 1",
		keyPluralMultipleEgArabic_two: "the plural form 2",
		keyPluralMultipleEgArabic_few: "the plural form 3",
		keyPluralMultipleEgArabic_many: "the plural form 4",
		keyPluralMultipleEgArabic_other: "the plural form 5",
	});
	expect(await runExportFilesParsed(imported)).toStrictEqual({
		keyPluralMultipleEgArabic_zero: "the plural form 0",
		keyPluralMultipleEgArabic_one: "the plural form 1",
		keyPluralMultipleEgArabic_two: "the plural form 2",
		keyPluralMultipleEgArabic_few: "the plural form 3",
		keyPluralMultipleEgArabic_many: "the plural form 4",
		keyPluralMultipleEgArabic_other: "the plural form 5",
	});

	expect(imported.bundles[0]?.id).toStrictEqual("keyPluralMultipleEgArabic");

	expect(imported?.messages[0]?.selectors).toStrictEqual([
		{ type: "variable-reference", name: "countPlural" },
	]);

	expect(imported.bundles[0]?.declarations).toStrictEqual(
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
	);

	const matches = imported.variants.map(
		(variant) => (variant.matches?.[0] as LiteralMatch).value
	);

	expect(matches).toStrictEqual(["zero", "one", "two", "few", "many", "other"]);
	expect(imported.variants[0]?.pattern).toStrictEqual([
		{ type: "text", value: "the plural form 0" },
	]);
	expect(imported.variants[1]?.pattern).toStrictEqual([
		{ type: "text", value: "the plural form 1" },
	]);
	expect(imported.variants[2]?.pattern).toStrictEqual([
		{ type: "text", value: "the plural form 2" },
	]);
	expect(imported.variants[3]?.pattern).toStrictEqual([
		{ type: "text", value: "the plural form 3" },
	]);
	expect(imported.variants[4]?.pattern).toStrictEqual([
		{ type: "text", value: "the plural form 4" },
	]);
	expect(imported.variants[5]?.pattern).toStrictEqual([
		{ type: "text", value: "the plural form 5" },
	]);
});

test("keyWithObjectValue", async () => {
	const imported = await runImportFiles({
		keyWithObjectValue: {
			valueA: "return this with valueB",
			valueB: "more text",
		},
	});
	expect(await runExportFilesParsed(imported)).toStrictEqual({
		keyWithObjectValue: {
			valueA: "return this with valueB",
			valueB: "more text",
		},
	});

	expect(imported.bundles[0]?.id).toStrictEqual("keyWithObjectValue.valueA");
	expect(imported.bundles[1]?.id).toStrictEqual("keyWithObjectValue.valueB");

	expect(
		imported.variants.find(
			(v) => v.messageBundleId === "keyWithObjectValue.valueA"
		)?.pattern
	).toStrictEqual([
		{ type: "text", value: "return this with valueB" },
	] satisfies Pattern);
	expect(
		imported.variants.find(
			(v) => v.messageBundleId === "keyWithObjectValue.valueB"
		)?.pattern
	).toStrictEqual([{ type: "text", value: "more text" }] satisfies Pattern);
});

test("keyWithArrayValue", async () => {
	const imported = await runImportFiles({
		keyWithArrayValue: ["multiple", "things"],
	});
	expect(await runExportFilesParsed(imported)).toStrictEqual({
		keyWithArrayValue: ["multiple", "things"],
	});

	expect(imported.bundles[0]?.id).toStrictEqual("keyWithArrayValue.0");
	expect(imported.bundles[1]?.id).toStrictEqual("keyWithArrayValue.1");

	expect(
		imported.variants.find((v) => v.messageBundleId === "keyWithArrayValue.0")
			?.pattern
	).toStrictEqual([{ type: "text", value: "multiple" }] satisfies Pattern);
	expect(
		imported.variants.find((v) => v.messageBundleId === "keyWithArrayValue.1")
			?.pattern
	).toStrictEqual([{ type: "text", value: "things" }] satisfies Pattern);
});

test("im- and exporting multiple files should succeed", async () => {
	const en = {
		key: "value",
	};
	const de = {
		key: "Wert",
	};

	const imported = await importFiles({
		settings: {} as any,
		files: [
			{
				locale: "en",
				content: new TextEncoder().encode(JSON.stringify(en)),
			},
			{
				locale: "de",
				content: new TextEncoder().encode(JSON.stringify(de)),
			},
		],
	});

	const exported = await runExportFiles(imported);

	const exportedEn = JSON.parse(
		new TextDecoder().decode(exported.find((e) => e.locale === "en")?.content)
	);
	const exportedDe = JSON.parse(
		new TextDecoder().decode(exported.find((e) => e.locale === "de")?.content)
	);

	expect(exportedEn).toStrictEqual({
		key: "value",
	});
	expect(exportedDe).toStrictEqual({
		key: "Wert",
	});
});

test("it should handle namespaces", async () => {
	const enCommon = {
		confirm: "value1",
	};
	const enLogin = {
		button: "value2",
	};

	const imported = await importFiles({
		settings: {} as any,
		files: [
			{
				locale: "en",
				content: new TextEncoder().encode(JSON.stringify(enCommon)),
				toBeImportedFilesMetadata: {
					namespace: "common",
				},
			},
			{
				locale: "en",
				content: new TextEncoder().encode(JSON.stringify(enLogin)),
				toBeImportedFilesMetadata: {
					namespace: "login",
				},
			},
		],
	});
	const exported = await runExportFiles(imported);

	const exportedCommon = JSON.parse(
		new TextDecoder().decode(
			exported.find((e) => e.name === "common-en.json")?.content
		)
	);
	const exportedLogin = JSON.parse(
		new TextDecoder().decode(
			exported.find((e) => e.name === "login-en.json")?.content
		)
	);

	expect(exportedCommon).toStrictEqual({
		confirm: "value1",
	});
	expect(exportedLogin).toStrictEqual({
		button: "value2",
	});
});

test("it should put new entities into the file without a namespace", async () => {
	const enNoNamespace = {
		blue_box: "value1",
	};

	const enCommon = {
		foo_bar: "value2",
	};

	const imported = await importFiles({
		settings: {} as any,
		files: [
			{
				locale: "en",
				content: new TextEncoder().encode(JSON.stringify(enNoNamespace)),
			},
			{
				locale: "en",
				content: new TextEncoder().encode(JSON.stringify(enCommon)),
				toBeImportedFilesMetadata: {
					namespace: "common",
				},
			},
		],
	});

	const newBundle: Bundle = {
		id: "new_bundle",
		declarations: [],
	};

	const newMessage: Message = {
		id: "mock-29jas",
		bundleId: "new_bundle",
		locale: "en",
		selectors: [],
	};

	const newVariant: Variant = {
		id: "mock-111sss",
		matches: [],
		messageId: "mock-29jas",
		pattern: [{ type: "text", value: "elephant" }],
	};

	const exported = await runExportFiles({
		bundles: [...imported.bundles, newBundle],
		messages: [...imported.messages, newMessage],
		variants: [...imported.variants, newVariant],
	});

	const exportedNoNamespace = JSON.parse(
		new TextDecoder().decode(
			exported.find((e) => e.name === "en.json")?.content
		)
	);

	const exportedCommon = JSON.parse(
		new TextDecoder().decode(
			exported.find((e) => e.name === "common-en.json")?.content
		)
	);

	expect(exportedNoNamespace).toStrictEqual({
		blue_box: "value1",
		new_bundle: "elephant",
	});

	expect(exportedCommon).toStrictEqual({
		foo_bar: "value2",
	});
});

test("a key with a single variant should have no matches even if other keys are multi variant", async () => {
	const imported = await runImportFiles({
		key: "value",
		keyPluralSimple_one: "the singular",
		keyPluralSimple_other: "the plural",
	});

	expect(await runExportFilesParsed(imported)).toStrictEqual({
		key: "value",
		keyPluralSimple_one: "the singular",
		keyPluralSimple_other: "the plural",
	});

	expect(imported.bundles).lengthOf(2);
	expect(imported.messages).lengthOf(3);
	expect(imported.variants).lengthOf(3);

	expect(imported.bundles[0]?.id).toStrictEqual("key");

	expect(imported.messages[0]?.selectors).toStrictEqual([]);
	expect(imported.variants[0]?.matches).toStrictEqual([]);
	expect(imported.variants[0]?.pattern).toStrictEqual([
		{ type: "text", value: "value" },
	]);
});

// https://github.com/opral/inlang-paraglide-js/issues/513
test("custom variable reference patterns can be provided", async () => {
	const settings = {
		"plugin.inlang.i18next": {
			variableReferencePattern: ["<", ">"],
		},
	};

	const imported = await runImportFiles(
		{
			blue: "blue {{blue}}",
			red: "red <red>",
		},
		settings
	);

	expect(imported.variants[0]?.pattern).toStrictEqual([
		{ type: "text", value: "blue {{blue}}" },
	] satisfies Pattern);
	expect(imported.variants[1]?.pattern).toStrictEqual([
		{ type: "text", value: "red " },
		{ type: "expression", arg: { type: "variable-reference", name: "red" } },
	] satisfies Pattern);

	expect(await runExportFilesParsed(imported, settings)).toStrictEqual({
		blue: "blue {{blue}}",
		red: "red <red>",
	});
});

// convenience wrapper for less testing code
function runImportFiles(json: Record<string, any>, settings?: any) {
	return importFiles({
		settings: settings ?? {},
		files: [
			{
				locale: "en",
				content: new TextEncoder().encode(JSON.stringify(json)),
			},
		],
	});
}

// convenience wrapper for less testing code
async function runExportFiles(
	imported: Awaited<ReturnType<typeof importFiles>>,
	settings?: any
) {
	// add ids which are undefined from the import
	for (const message of imported.messages) {
		if (message.id === undefined) {
			message.id = `${Math.random() * 1000}`;
		}
	}
	for (const variant of imported.variants) {
		if (variant.id === undefined) {
			// @ts-expect-error - variant is an VariantImport
			variant.id = `${Math.random() * 1000}`;
		}
		if (variant.messageId === undefined) {
			// @ts-expect-error - variant is an VariantImport
			variant.messageId = imported.messages.find(
				(m: any) =>
					m.bundleId === variant.messageBundleId &&
					m.locale === variant.messageLocale
			)?.id;
		}
	}

	const exported = await exportFiles({
		settings: settings ?? {},
		bundles: imported.bundles as Bundle[],
		messages: imported.messages as Message[],
		variants: imported.variants as Variant[],
	});
	return exported;
}

// convenience wrapper for less testing code
async function runExportFilesParsed(imported: any, settings?: any) {
	const exported = await runExportFiles(imported, settings);
	return JSON.parse(new TextDecoder().decode(exported[0]?.content));
}
