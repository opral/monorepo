import { test, expect, vi } from "vitest";
import { importFiles } from "./importFiles.js";
import { loadProjectInMemory } from "../project/loadProjectInMemory.js";
import { newProject } from "../project/newProject.js";
import type { InlangPlugin } from "../plugin/schema.js";

test("it should insert a message as is if the id is provided", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });

	const mockPlugin: InlangPlugin = {
		key: "mock",
		importFiles: async () => ({ bundles: [], messages: [], variants: [] }),
	};

	const result = await importFiles({
		db: project.db,
		files: [{ content: new Uint8Array(), locale: "mock" }],
		pluginKey: "mock",
		plugins: [mockPlugin],
		settings: {} as any,
	});
});

test("it should match an existing message if the id is not provided", async () => {});

test("it should create a bundle for a message if the bundle does not exist to avoid foreign key conflicts", async () => {
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
		db: project.db,
		files: [{ content: new Uint8Array(), locale: "mock" }],
		pluginKey: "mock",
		plugins: [mockPlugin],
		settings: {} as any,
	});

	const bundles = await project.db.selectFrom("bundle").selectAll().execute();

	expect(bundles.length).toBe(1);
	expect(bundles[0]?.id).toBe("non-existent-bundle");
});

test("it should insert a variant as is if the id is provided", async () => {});

test("it should match an existing variant if the id is not provided", async () => {});

test("it should create a message for a variant if the message does not exist to avoid foreign key conflicts", async () => {});
