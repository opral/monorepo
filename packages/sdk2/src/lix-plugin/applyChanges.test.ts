import { test, expect } from "vitest";
import { loadProjectInMemory } from "../project/loadProjectInMemory.js";
import { newProject } from "../project/newProject.js";
import type { Change } from "@lix-js/sdk";
import type { Bundle } from "../schema/schemaV2.js";
import { applyChanges } from "./applyChanges.js";
import { initKysely } from "../database/initKysely.js";
import { loadDatabaseInMemory } from "sqlite-wasm-kysely";

test("it should delete a type if the parent one level ", async () => {
	const project = await loadProjectInMemory({
		blob: await newProject(),
	});

	const changes: Change[] = [
		{
			id: "1",
			parent_id: undefined,
			operation: "create",
			file_id: "mock",
			plugin_key: "mock",
			type: "bundle",
			// @ts-expect-error - type error somewhere
			value: {
				id: "mock",
				alias: {
					foo: "mock-alias",
				},
			} satisfies Bundle,
		},
		{
			id: "2",
			parent_id: "1",
			operation: "update",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			// @ts-expect-error - type error somewhere
			value: {
				id: "mock",
				alias: {
					foo: "mock-alias-updated",
				},
			} satisfies Bundle,
		},
		{
			id: "3",
			parent_id: "2",
			operation: "delete",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			value: undefined,
		},
	];

	await project.db
		.insertInto("bundle")
		.values({
			id: "mock",
			// @ts-expect-error - todo auto serialize values
			alias: JSON.stringify({
				foo: "mock-alias",
			}),
		})
		.execute();

	const dbFile = await project.lix.db
		.selectFrom("file")
		.selectAll()
		.where("path", "=", "/db.sqlite")
		.executeTakeFirstOrThrow();

	const dbFileAfter = await applyChanges({
		lix: project.lix,
		file: dbFile,
		changes,
	});

	const db = initKysely({
		sqlite: await loadDatabaseInMemory(dbFileAfter.fileData),
	});

	const bundles = await db.selectFrom("bundle").selectAll().execute();

	expect(bundles).toHaveLength(0);
});
