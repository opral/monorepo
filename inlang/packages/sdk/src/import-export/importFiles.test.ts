import { test, expect } from "vitest";
import { importFiles } from "./importFiles.js";
import { loadProjectInMemory } from "../project/loadProjectInMemory.js";
import { newProject } from "../project/newProject.js";
import type { InlangPlugin } from "../plugin/schema.js";
import type { Declaration } from "../json-schema/pattern.js";

test("it should insert a message as is if the id is provided", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });

	const mockPlugin: InlangPlugin = {
		key: "mock",
		importFiles: async () => ({
			bundles: [{ id: "mock-bundle" }],
			messages: [{ id: "alfa23", bundleId: "mock-bundle", locale: "en" }],
			variants: [],
		}),
	};

	await importFiles({
		project,
		files: [{ content: new Uint8Array(), locale: "mock" }],
		pluginKey: "mock",
		plugins: [mockPlugin],
		settings: {} as any,
	});

	const messages = await project.db.selectFrom("message").selectAll().execute();

	expect(messages.length).toBe(1);
	expect(messages[0]?.id).toBe("alfa23");
});

test("it should match an existing message if the id is not provided", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });

	await project.db
		.insertInto("bundle")
		.values({ id: "mock-bundle", declarations: [] })
		.execute();
	await project.db
		.insertInto("message")
		.values({
			id: "alfa23",
			bundleId: "mock-bundle",
			locale: "en",
			selectors: [],
		})
		.execute();

	const mockPlugin: InlangPlugin = {
		key: "mock",
		importFiles: async () => ({
			bundles: [],
			messages: [
				{
					bundleId: "mock-bundle",
					locale: "en",
					selectors: [{ type: "variable-reference", name: "platform" }],
				},
			],
			variants: [],
		}),
	};

	await importFiles({
		project,
		files: [{ content: new Uint8Array(), locale: "mock" }],
		pluginKey: "mock",
		plugins: [mockPlugin],
		settings: {} as any,
	});

	const messages = await project.db.selectFrom("message").selectAll().execute();

	expect(messages.length).toBe(1);
	expect(messages[0]?.id).toBe("alfa23");
	expect(messages[0]?.selectors).toStrictEqual([
		{ type: "variable-reference", name: "platform" },
	]);
});

test("it should create a bundle for a message if the bundle does not exist to avoid foreign key conflicts and enable partial imports", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });

	const mockPlugin: InlangPlugin = {
		key: "mock",
		importFiles: async () => ({
			bundles: [],
			messages: [{ bundleId: "non-existent-bundle", locale: "en" }],
			variants: [],
		}),
	};

	await importFiles({
		project,
		files: [{ content: new Uint8Array(), locale: "mock" }],
		pluginKey: "mock",
		plugins: [mockPlugin],
		settings: {} as any,
	});

	const bundles = await project.db.selectFrom("bundle").selectAll().execute();

	expect(bundles.length).toBe(1);
	expect(bundles[0]?.id).toBe("non-existent-bundle");
});

test("it should insert a variant as is if the id is provided", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });

	await project.db
		.insertInto("bundle")
		.values({ id: "mock-bundle", declarations: [] })
		.execute();
	await project.db
		.insertInto("message")
		.values({
			id: "mock-message",
			bundleId: "mock-bundle",
			locale: "en",
		})
		.execute();

	const mockPlugin: InlangPlugin = {
		key: "mock",
		importFiles: async () => ({
			bundles: [],
			messages: [],
			variants: [{ id: "variant-id-23", messageId: "mock-message" }],
		}),
	};

	await importFiles({
		project,
		files: [{ content: new Uint8Array(), locale: "mock" }],
		pluginKey: "mock",
		plugins: [mockPlugin],
		settings: {} as any,
	});

	const variants = await project.db.selectFrom("variant").selectAll().execute();

	expect(variants.length).toBe(1);
	expect(variants[0]?.id).toBe("variant-id-23");
});

test("it should match an existing variant if the id is not provided", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });

	await project.db
		.insertInto("bundle")
		.values({ id: "mock-bundle", declarations: [] })
		.execute();
	await project.db
		.insertInto("message")
		.values({
			id: "mock-message",
			bundleId: "mock-bundle",
			locale: "en",
		})
		.execute();

	const mockPlugin: InlangPlugin = {
		key: "mock",
		importFiles: async () => ({
			bundles: [],
			messages: [],
			variants: [{ messageBundleId: "mock-bundle", messageLocale: "en" }],
		}),
	};

	await importFiles({
		project,
		files: [{ content: new Uint8Array(), locale: "mock" }],
		pluginKey: "mock",
		plugins: [mockPlugin],
		settings: {} as any,
	});

	const variants = await project.db.selectFrom("variant").selectAll().execute();

	expect(variants.length).toBe(1);
	expect(variants[0]?.messageId).toBe("mock-message");
	expect(variants[0]?.id).toBeDefined();
});

test("it should create a message for a variant if the message does not exist to avoid foreign key conflicts and enable partial imports", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });

	await project.db
		.insertInto("bundle")
		.values({ id: "mock-bundle", declarations: [] })
		.execute();

	const mockPlugin: InlangPlugin = {
		key: "mock",
		importFiles: async () => ({
			bundles: [],
			messages: [],
			variants: [{ messageBundleId: "mock-bundle", messageLocale: "en" }],
		}),
	};

	await importFiles({
		project,
		files: [{ content: new Uint8Array(), locale: "mock" }],
		pluginKey: "mock",
		plugins: [mockPlugin],
		settings: {} as any,
	});

	const bundles = await project.db.selectFrom("bundle").selectAll().execute();
	const messages = await project.db.selectFrom("message").selectAll().execute();
	const variants = await project.db.selectFrom("variant").selectAll().execute();

	expect(bundles.length).toBe(1);
	expect(messages.length).toBe(1);
	expect(variants.length).toBe(1);

	expect(messages[0]?.bundleId).toBe("mock-bundle");
	expect(messages[0]?.locale).toBe("en");
	expect(variants[0]?.messageId).toBe(messages[0]?.id);
});

test("it should persist bundle declarations returned by the plugin", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });

	await project.db
		.insertInto("bundle")
		.values({ id: "blue_horse_shoe", declarations: [] })
		.execute();

	const declarations: Declaration[] = [
		{ type: "input-variable", name: "username" },
		{ type: "input-variable", name: "placename" },
	];

	const mockPlugin: InlangPlugin = {
		key: "mock",
		importFiles: async () => ({
			bundles: [{ id: "blue_horse_shoe", declarations }],
			messages: [],
			variants: [],
		}),
	};

	await importFiles({
		project,
		files: [{ content: new Uint8Array(), locale: "mock" }],
		pluginKey: "mock",
		plugins: [mockPlugin],
		settings: {} as any,
	});

	const bundle = await project.db
		.selectFrom("bundle")
		.selectAll()
		.where("id", "=", "blue_horse_shoe")
		.executeTakeFirstOrThrow();

	expect(bundle.declarations).toStrictEqual(declarations);
});
