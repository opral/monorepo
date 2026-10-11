import { expect, test } from "vitest";
import { importFiles } from "./importFiles.js";
import { exportFiles } from "./exportFiles.js";

test("imports and exports a single next-intl file", async () => {
	const imported = await runImportFiles({
		title: "Hello {name}",
		nested: {
			body: "Welcome",
		},
	});

	expect(imported.bundles.map((bundle) => bundle.id)).toEqual([
		"title",
		"nested.body",
	]);
	expect(imported.variants[0]?.pattern).toEqual([
		{ type: "text", value: "Hello " },
		{ type: "expression", arg: { type: "variable-reference", name: "name" } },
	]);

	const exported = await runExportFilesParsed(imported);

	expect(exported).toStrictEqual({
		title: "Hello {name}",
		nested: {
			body: "Welcome",
		},
	});
});

test("imports and exports flat dotted keys without nesting them", async () => {
	const imported = await runImportFiles({
		"test.test": "Flat dotted key",
	});

	expect(imported.bundles.map((bundle) => bundle.id)).toEqual(["test.test"]);
	expect(await runExportFilesParsed(imported)).toStrictEqual({
		"test.test": "Flat dotted key",
	});
});

test("nests newly-created keys at their dots, as next-intl reads them", async () => {
	// next-intl reads t("test.test") from { test: { test } }, never from a
	// "test.test" key (keys can't contain dots)
	const exported = await exportFiles({
		settings: {} as any,
		bundles: [{ id: "test.test", declarations: [] }] as any,
		messages: [
			{
				id: "message-1",
				bundleId: "test.test",
				locale: "en",
				selectors: [],
			},
		] as any,
		variants: [
			{
				id: "variant-1",
				messageId: "message-1",
				matches: [],
				pattern: [{ type: "text", value: "Nested key" }],
			},
		] as any,
	});

	expect(JSON.parse(new TextDecoder().decode(exported[0]?.content))).toEqual({
		test: { test: "Nested key" },
	});
});

test("a new message of a bundle goes where the bundle's other messages are", async () => {
	const imported = await runImportFiles({
		Legacy: { "key.with.dots": "A key with dots" },
		Home: { title: "Home" },
	});
	const added = [
		["Legacy.key.with.dots", "de"],
		["Home.subtitle", "en"],
		["Home.title.long", "en"],
	] as const;
	const exported = await exportFiles({
		settings: {} as any,
		bundles: [
			...imported.bundles,
			{ id: "Home.subtitle", declarations: [] },
			{ id: "Home.title.long", declarations: [] },
		],
		messages: [
			...imported.messages,
			...added.map(([bundleId, locale]) => ({
				id: `new-${bundleId}`,
				bundleId,
				locale,
				selectors: [],
			})),
		],
		variants: [
			...imported.variants.map((variant, index) => ({
				...variant,
				id: `variant-${index}`,
				messageId: imported.messages[index]!.id,
			})),
			...added.map(([bundleId, locale]) => ({
				id: `variant-new-${bundleId}`,
				messageId: `new-${bundleId}`,
				matches: [],
				pattern: [{ type: "text", value: `${bundleId} (${locale})` }],
			})),
		],
	} as any);
	const parsed = (locale: string) =>
		JSON.parse(
			new TextDecoder().decode(
				exported.find((file) => file.locale === locale)!.content
			)
		);

	expect(parsed("de")).toStrictEqual({
		Legacy: { "key.with.dots": "Legacy.key.with.dots (de)" },
	});
	expect(parsed("en")).toStrictEqual({
		// "Home.title" is a message, so next-intl can't read "Home.title.long"
		// either way: it stays a flat key instead of replacing "Home.title"
		"Home.title.long": "Home.title.long (en)",
		Legacy: { "key.with.dots": "A key with dots" },
		Home: { title: "Home", subtitle: "Home.subtitle (en)" },
	});
});

test("skips empty objects while importing", async () => {
	const imported = await runImportFiles({
		a: {
			b: {},
		},
		title: "Hello",
	});

	expect(imported.bundles.map((bundle) => bundle.id)).toEqual(["title"]);
	expect(await runExportFilesParsed(imported)).toStrictEqual({
		title: "Hello",
	});
});

test("imports and exports namespace files", async () => {
	const imported = await importFiles({
		settings: {
			"plugin.inlang.nextIntl": {
				pathPattern: {
					About: "./messages/{locale}/About.json",
					HomePage: "./messages/{locale}/HomePage.json",
				},
			},
		} as any,
		files: [
			{
				locale: "en",
				content: new TextEncoder().encode(
					JSON.stringify({ title: "About us" })
				),
				toBeImportedFilesMetadata: {
					namespace: "About",
				},
			},
			{
				locale: "en",
				content: new TextEncoder().encode(
					JSON.stringify({ hero: { title: "Welcome" } })
				),
				toBeImportedFilesMetadata: {
					namespace: "HomePage",
				},
			},
		],
	});

	expect(imported.bundles.map((bundle) => bundle.id)).toEqual([
		"About.title",
		"HomePage.hero.title",
	]);

	const exported = await runExportFiles(imported, {
		"plugin.inlang.nextIntl": {
			pathPattern: {
				About: "./messages/{locale}/About.json",
				HomePage: "./messages/{locale}/HomePage.json",
			},
		},
	});
	const exportedAbout = exported.find((file) => file.name === "About-en.json");
	const exportedHomePage = exported.find(
		(file) => file.name === "HomePage-en.json"
	);

	expect(
		JSON.parse(new TextDecoder().decode(exportedAbout?.content))
	).toStrictEqual({
		title: "About us",
	});
	expect(
		JSON.parse(new TextDecoder().decode(exportedHomePage?.content))
	).toStrictEqual({
		hero: {
			title: "Welcome",
		},
	});
	expect((exportedAbout as any)?.metadata).toStrictEqual({
		namespace: "About",
	});
	expect((exportedHomePage as any)?.metadata).toStrictEqual({
		namespace: "HomePage",
	});
});

test("exports renamed imported namespace keys using the current bundle id", async () => {
	const imported = await importFiles({
		settings: {
			"plugin.inlang.nextIntl": {
				pathPattern: {
					About: "./messages/{locale}/About.json",
				},
			},
		} as any,
		files: [
			{
				locale: "en",
				content: new TextEncoder().encode(
					JSON.stringify({ title: "About us" })
				),
				toBeImportedFilesMetadata: {
					namespace: "About",
				},
			},
		],
	});
	imported.bundles[0]!.id = "About.heading";
	imported.messages[0]!.bundleId = "About.heading";
	imported.variants[0]!.messageBundleId = "About.heading";

	const exported = await runExportFiles(imported, {
		"plugin.inlang.nextIntl": {
			pathPattern: {
				About: "./messages/{locale}/About.json",
			},
		},
	});

	expect(JSON.parse(new TextDecoder().decode(exported[0]?.content))).toEqual({
		heading: "About us",
	});
});

test("exports bundle ids equal to a namespace as regular keys", async () => {
	const exported = await exportFiles({
		settings: {
			"plugin.inlang.nextIntl": {
				pathPattern: {
					About: "./messages/{locale}/About.json",
				},
			},
		} as any,
		bundles: [{ id: "About" }] as any,
		messages: [
			{
				id: "message-1",
				bundleId: "About",
				locale: "en",
				selectors: [],
			},
		] as any,
		variants: [
			{
				id: "variant-1",
				messageId: "message-1",
				pattern: [{ type: "text", value: "About us" }],
			},
		] as any,
	});

	expect((exported[0] as any)?.metadata).toBeUndefined();
	expect(JSON.parse(new TextDecoder().decode(exported[0]?.content))).toEqual({
		About: "About us",
	});
});

test("exports sourceLanguageFilePath metadata for the SDK writer", async () => {
	const settings = {
		baseLocale: "en",
		locales: ["en", "de"],
		"plugin.inlang.nextIntl": {
			pathPattern: "./messages/{locale}.json",
			sourceLanguageFilePath: "./messages/main.json",
		},
	};
	const exported = await exportFiles({
		settings: settings as any,
		bundles: [{ id: "title" }] as any,
		messages: [
			{
				id: "message-1",
				bundleId: "title",
				locale: "en",
				selectors: [],
			},
			{
				id: "message-2",
				bundleId: "title",
				locale: "de",
				selectors: [],
			},
		] as any,
		variants: [
			{
				id: "variant-1",
				messageId: "message-1",
				pattern: [{ type: "text", value: "Hello" }],
			},
			{
				id: "variant-2",
				messageId: "message-2",
				pattern: [{ type: "text", value: "Hallo" }],
			},
		] as any,
	});
	const sourceFile = (exported as any[]).find((file) => file.locale === "en");
	const targetFile = (exported as any[]).find((file) => file.locale === "de");

	expect(sourceFile?.metadata?.pathPattern).toBe("./messages/main.json");
	expect(targetFile?.metadata?.pathPattern).toBeUndefined();
	expect(settings["plugin.inlang.nextIntl"].pathPattern).toBe(
		"./messages/{locale}.json"
	);
});

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

async function runExportFiles(
	imported: Awaited<ReturnType<typeof importFiles>>,
	settings?: any
) {
	for (const [index, message] of imported.messages.entries()) {
		(message as any).id ??= `message-${index}`;
	}
	for (const [index, variant] of imported.variants.entries()) {
		(variant as any).id ??= `variant-${index}`;
		(variant as any).messageId ??= imported.messages.find(
			(message) =>
				message.bundleId === variant.messageBundleId &&
				message.locale === variant.messageLocale
		)?.id;
	}

	return exportFiles({
		settings: settings ?? {},
		bundles: imported.bundles as any,
		messages: imported.messages as any,
		variants: imported.variants as any,
	});
}

async function runExportFilesParsed(
	imported: Awaited<ReturnType<typeof importFiles>>,
	settings?: any
) {
	const exported = await runExportFiles(imported, settings);
	return JSON.parse(new TextDecoder().decode(exported[0]?.content));
}
