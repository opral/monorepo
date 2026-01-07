// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { test, expect } from "vitest";
import { loadProjectInMemory } from "../project/loadProjectInMemory.js";
import { newProject } from "../project/newProject.js";
import type { Change, NewChange } from "@lix-js/sdk";
import { applyChanges } from "./applyChanges.js";
import { loadDatabaseInMemory } from "sqlite-wasm-kysely";
import { initDb } from "../database/initDb.js";
import type { Bundle } from "../database/schema.js";

test.skip("it should be able to delete", async () => {
	const project = await loadProjectInMemory({
		blob: await newProject(),
	});

	const changes: NewChange[] = [
		{
			id: "1",
			operation: "create",
			file_id: "mock",
			plugin_key: "mock",
			type: "bundle",
			meta: { id: "mock" },
			value: {
				id: "mock",
				declarations: [],
			} satisfies Bundle,
		},
		{
			id: "2",
			parent_id: "1",
			operation: "update",
			file_id: "mock",
			plugin_key: "mock",
			type: "bundle",
			meta: {
				id: "mock",
			},
			value: {
				id: "mock",
				declarations: [],
			} satisfies Bundle,
		},
		{
			id: "3",
			parent_id: "2",
			operation: "delete",
			file_id: "mock",
			plugin_key: "mock",
			meta: {
				id: "mock",
			},
			type: "bundle",
			value: undefined,
		},
	];

	await project.db
		.insertInto("bundle")
		.values({
			id: "mock",
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
		changes: changes as Change[],
	});

	const db = initDb({
		sqlite: await loadDatabaseInMemory(dbFileAfter.fileData),
	});

	const bundles = await db.selectFrom("bundle").selectAll().execute();

	expect(bundles).toHaveLength(0);
});

test.skip("it should be able to upsert (insert & update)", async () => {
	const project = await loadProjectInMemory({
		blob: await newProject(),
	});

	const changes: NewChange[] = [
		{
			id: "1",
			parent_id: undefined,
			operation: "create",
			file_id: "mock",
			plugin_key: "mock",
			type: "bundle",
			meta: { id: "mock" },
			value: {
				id: "mock",
				declarations: [],
			} satisfies Bundle,
		},
		{
			id: "2",
			parent_id: "1",
			operation: "update",
			file_id: "mock",
			plugin_key: "mock",
			type: "bundle",
			meta: {
				id: "mock",
			},
			value: {
				id: "mock",
				declarations: [],
			} satisfies Bundle,
		},
	];

	await project.db
		.insertInto("bundle")
		.values({
			id: "mock",
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
		changes: changes as Change[],
	});

	const db = initDb({
		sqlite: await loadDatabaseInMemory(dbFileAfter.fileData),
	});

	const bundles = await db.selectFrom("bundle").selectAll().execute();

	expect(bundles).toHaveLength(1);
});
