/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { test, expect } from "vitest";
import type { InlangPlugin } from "../plugin/schema.js";
import type { BundleNested, Message } from "../database/schema.js";
import type { Text } from "../json-schema/pattern.js";
import { exportFiles, importFiles } from "./index.js";
import { loadProjectInMemory } from "../project/loadProjectInMemory.js";
import { newProject } from "../project/newProject.js";
import { selectBundleNested } from "../query-utilities/selectBundleNested.js";
import { insertBundleNested } from "../query-utilities/insertBundleNested.js";

test("the file should be identical after a roundtrip if no modifications occured", async () => {
	const project = await loadProjectInMemory({
		blob: await newProject(),
	});

	const enResource = JSON.stringify({
		hello_world: "value1",
	});

	await importFiles({
		files: [{ content: new TextEncoder().encode(enResource), locale: "en" }],
		pluginKey: "mock",
		plugins: [mockPluginSimple],
		settings: await project.settings.get(),
		db: project.db,
	});

	const importedBundles = await selectBundleNested(project.db)
		.selectAll()
		.execute();
	const importedMessages = importedBundles.flatMap((bundle) => bundle.messages);
	const importedVariants = importedMessages.flatMap(
		(message) => message.variants
	);

	expect(importedBundles.length).toBe(1);
	expect(importedMessages.length).toBe(1);
	expect(importedVariants.length).toBe(1);
	expect(importedBundles[0]?.id).toBe("hello_world");
	expect(importedMessages[0]?.bundleId).toBe("hello_world");

	const exportedFiles = await exportFiles({
		pluginKey: "mock",
		plugins: [mockPluginSimple],
		settings: await project.settings.get(),
		db: project.db,
	});

	expect(exportedFiles.length).toBe(1);
	expect(exportedFiles[0]?.name).toBe("en.json");
	expect(new TextDecoder().decode(exportedFiles[0]?.content)).toBe(enResource);
});

test("a variant with an existing match should update the existing variant and not create a new one to enable roundtrips", async () => {
	const project = await loadProjectInMemory({
		blob: await newProject(),
	});

	const bundleWithMatches: BundleNested = {
		id: "mock-bundle-id",
		declarations: [],
		messages: [
			{
				id: "mock-message-id",
				locale: "en",
				selectors: [],
				bundleId: "mock-bundle-id",
				variants: [
					{
						id: "mock-variant-id",
						messageId: "mock-message-id",
						matches: [
							{
								type: "literal-match",
								key: "color",
								value: "blue",
							},
						],
						pattern: [
							{
								type: "text",
								value: "You have blue eyes.",
							},
						],
					},
				],
			},
		],
	};

	const updatedBundleWithMatches = structuredClone(bundleWithMatches);
	// @ts-expect-error - we know this is a text pattern
	updatedBundleWithMatches.messages[0].variants[0].pattern[0].value =
		"You have beautiful blue eyes.";

	const enResource = JSON.stringify([updatedBundleWithMatches]);

	await importFiles({
		files: [{ content: new TextEncoder().encode(enResource), locale: "en" }],
		pluginKey: "mock",
		plugins: [mockPluginAst],
		settings: await project.settings.get(),
		db: project.db,
	});

	const bundles = await project.db.selectFrom("bundle").selectAll().execute();
	const messages = await project.db.selectFrom("message").selectAll().execute();
	const variants = await project.db.selectFrom("variant").selectAll().execute();

	expect(bundles.length).toBe(1);
	expect(messages.length).toBe(1);
	expect(variants.length).toBe(1);
	// @ts-expect-error - we know this is a text pattern
	expect(variants[0]?.pattern[0].value).toBe("You have beautiful blue eyes.");
});

test("if a message for the bundle id and locale already exists, update it. don't create a new message", async () => {
	const project = await loadProjectInMemory({
		blob: await newProject(),
	});

	const existingBundle: BundleNested = {
		id: "mock-bundle-id",
		declarations: [],
		messages: [
			{
				id: "mock-message-id",
				locale: "en",
				selectors: [
					{
						type: "variable-reference",
						name: "variable1",
					},
				],
				bundleId: "mock-bundle-id",
				variants: [],
			},
		],
	};

	const updatedBundle = structuredClone(existingBundle);
	updatedBundle.messages[0]!.selectors = [
		{
			type: "variable-reference",
			name: "variable2",
		},
	] satisfies Message["selectors"];

	const enResource = JSON.stringify([updatedBundle]);

	await importFiles({
		files: [{ content: new TextEncoder().encode(enResource), locale: "en" }],
		pluginKey: "mock",
		plugins: [mockPluginAst],
		settings: await project.settings.get(),
		db: project.db,
	});

	const bundles = await project.db.selectFrom("bundle").selectAll().execute();
	const messages = await project.db.selectFrom("message").selectAll().execute();

	expect(bundles.length).toBe(1);
	expect(messages.length).toBe(1);

	expect(messages[0]?.selectors).toStrictEqual([
		{
			type: "variable-reference",
			name: "variable2",
		},
	]);
});

test("keys should be ordered alphabetically for .json to minimize git diffs", async () => {
	const project = await loadProjectInMemory({
		blob: await newProject(),
	});

	const enResource = JSON.stringify({
		a: "value1",
		b: "value2",
		d: "value4",
	});

	await importFiles({
		files: [{ content: new TextEncoder().encode(enResource), locale: "en" }],
		pluginKey: "mock",
		plugins: [mockPluginSimple],
		settings: await project.settings.get(),
		db: project.db,
	});

	await insertBundleNested(
		project.db,
		mockBundle({
			id: "c",
			locale: "en",
			text: "value3",
		})
	);

	const exportedFiles = await exportFiles({
		pluginKey: "mock",
		plugins: [mockPluginSimple],
		settings: await project.settings.get(),
		db: project.db,
	});

	expect(
		JSON.parse(new TextDecoder().decode(exportedFiles[0]?.content))
	).toStrictEqual({
		a: "value1",
		b: "value2",
		c: "value3",
		d: "value4",
	});
});

const mockPluginAst: InlangPlugin = {
	key: "mock",
	exportFiles: async ({ bundles }) => {
		return [
			{
				locale: "every",
				name: "bundles.json",
				content: new TextEncoder().encode(JSON.stringify(bundles)),
			},
		];
	},
	importFiles: async ({ files }) => {
		return {
			bundles: files.flatMap((file) =>
				JSON.parse(new TextDecoder().decode(file.content))
			),
		};
	},
};

// a simple mock plugin to test roundtrips
//
// purposefully not imported a real plugin
// to keep the interdepenedencies low and
// increase maintainability
const mockPluginSimple: InlangPlugin = {
	key: "mock",
	exportFiles: async ({ bundles }) => {
		const jsons: any = {};
		const messages = bundles.flatMap((bundle) => bundle.messages);
		for (const message of messages) {
			const key = message.bundleId;
			const value = (message.variants[0]?.pattern[0] as Text).value;
			if (!jsons[message.locale]) {
				jsons[message.locale] = {};
			}
			jsons[message.locale][key] = value;
		}
		return Object.entries(jsons).map(([locale, json]) => ({
			locale,
			name: locale + ".json",
			content: new TextEncoder().encode(JSON.stringify(json)),
		}));
	},
	importFiles: async ({ files }) => {
		const bundles: BundleNested[] = [];
		for (const file of files) {
			const parsed = JSON.parse(new TextDecoder().decode(file.content));
			for (const key in parsed) {
				bundles.push(
					mockBundle({ id: key, locale: file.locale, text: parsed[key] })
				);
			}
		}
		return {
			bundles,
		};
	},
};

function mockBundle(args: {
	id: string;
	locale: string;
	text: string;
}): BundleNested {
	return {
		id: args.id,
		declarations: [],
		messages: [
			{
				id: args.id + args.locale,
				locale: args.locale,
				selectors: [],
				bundleId: args.id,
				variants: [
					{
						id: args.id + args.locale,
						messageId: args.id + args.locale,
						matches: [],
						pattern: [
							{
								type: "text",
								value: args.text,
							},
						],
					},
				],
			},
		],
	};
}
