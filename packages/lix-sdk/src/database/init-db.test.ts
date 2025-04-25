import { createInMemoryDatabase } from "sqlite-wasm-kysely";
import { test, expect } from "vitest";
import { initDb } from "./init-db.js";
import { validate } from "uuid";
import { mockChange } from "../change/mock-change.js";
import { jsonSha256 } from "../snapshot/json-sha-256.js";
import { sql } from "kysely";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { updateChangesInVersion } from "../version/update-changes-in-version.js";
import { createVersion } from "../version/create-version.js";

// file ids are always in the URL of lix apps
// to increase sharing, the ids should be as short as possible
//
// 129 million file creations will lead to a 1% chance of a collision
//
// if someone uses lix to handle 129 million files, we can
// increase the length of the id :D
test("file ids should default to nano_id(10)", async () => {
	const lix = await openLixInMemory({});

	const file = await lix.db
		.insertInto("file")
		.values({
			path: "/mock.txt",
			data: new Uint8Array(),
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(file.id.length).toBe(10);
});

test("change ids should default to uuid", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });

	const change = await db
		.insertInto("change")
		.values({
			schema_key: "file",
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock-plugin",
			snapshot_id: "no-content",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(validate(change.id)).toBe(true);
});

test("snapshot ids should default to sha256", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });

	const content = { a: "value" };

	const snapshot = await db
		.insertInto("snapshot")
		.values({
			content,
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(snapshot.id).toBe(jsonSha256(content));
});

test("inserting the same snapshot multiple times should be possible and not lead to duplicates (content addressable)", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });

	const initialSnapshots = await db
		.selectFrom("snapshot")
		.selectAll()
		.execute();

	const snapshot1 = await db
		.insertInto("snapshot")
		.values({
			content: { a: "some data" },
		})
		.onConflict((oc) => oc.doNothing())
		.returningAll()
		.executeTakeFirstOrThrow();

	const snapshot2 = await db
		.insertInto("snapshot")
		.values({
			content: { a: "some data" },
		})
		.onConflict((oc) =>
			oc.doUpdateSet((eb) => ({
				content: eb.ref("excluded.content"),
			}))
		)
		.returningAll()
		.executeTakeFirstOrThrow();

	const snapshots = await db.selectFrom("snapshot").selectAll().execute();

	expect(snapshots).toHaveLength(initialSnapshots.length + 1);
	expect(snapshot1.id).toBe(snapshot2.id);
});

test("an empty snapshot should default to the special 'no-content' snapshot to store disk space", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });
	const snapshot = await db
		.insertInto("snapshot")
		.values({
			content: null,
		})
		.onConflict((oc) =>
			oc.doUpdateSet((eb) => ({
				content: eb.ref("excluded.content"),
			}))
		)
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(snapshot.id).toBe("no-content");
});

// https://github.com/opral/lix-sdk/issues/71
test("files should be able to have metadata", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });

	sqlite.createFunction({
		name: "triggerFileQueue",
		arity: 0,
		// @ts-expect-error - dynamic function
		xFunc: () => {
			// console.log('test')
		},
	});

	const file = await db
		.insertInto("file")
		.values({
			path: "/mock.csv",
			data: new Uint8Array(),
			metadata: {
				primary_key: "email",
			},
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(file.metadata?.primary_key).toBe("email");

	const updatedFile = await db
		.updateTable("file")
		.where("path", "=", "/mock.csv")
		.set({
			metadata: {
				primary_key: "something-else",
			},
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(updatedFile.metadata?.primary_key).toBe("something-else");
});


// 2M IDs needed, in order to have a 1% probability of at least one collision.
// it is assumed that creating 2 million labels is ... unlikely
test("label.id is nano_id(8)", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });

	const label = await db
		.insertInto("label")
		.values({
			name: "mock",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(label.id.length).toBe(8);
});

test("the checkpoint label should be created if it doesn't exist", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });

	const tag = await db
		.selectFrom("label")
		.selectAll()
		.where("name", "=", "checkpoint")
		.executeTakeFirst();

	expect(tag).toMatchObject({
		name: "checkpoint",
	});
});

test("a default main version should exist", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });

	const version = await db
		.selectFrom("version")
		.selectAll()
		.where("name", "=", "main")
		.executeTakeFirst();

	expect(version).toBeDefined();
});

test("re-opening the same database shouldn't lead to duplicate insertion of the current version", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });

	const newversion = await db
		.insertInto("version")
		.values({ name: "mock" })
		.returningAll()
		.executeTakeFirstOrThrow();

	await db.updateTable("current_version").set({ id: newversion.id }).execute();

	const db2 = initDb({ sqlite });

	const currentversion = await db2
		.selectFrom("current_version")
		.selectAll()
		.execute();

	expect(currentversion).toHaveLength(1);
});

test("invalid file paths should be rejected", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });

	// init the trigger function (usually defined by lix only)
	sqlite.createFunction({
		name: "triggerFileQueue",
		arity: 0,
		// @ts-expect-error - dynamic function
		xFunc: () => {},
	});

	await expect(
		db
			.insertInto("file")
			.values({
				path: "invalid-path",
				data: new Uint8Array(),
			})
			.returningAll()
			.execute()
	).rejects.toThrowError("File path must start with a slash");
});

test("vector clock functions", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });

	const vectorClockTick1 =
		await sql`select lix_session() as session, lix_session_clock_tick() as time`.execute(
			db
		);
	const vectorClockTick2 =
		await sql`select lix_session() as session, lix_session_clock_tick() as time`.execute(
			db
		);

	expect((vectorClockTick1.rows[0] as any)["session"]).toEqual(
		(vectorClockTick2.rows[0] as any)["session"]
	);
	expect((vectorClockTick1.rows[0] as any)["time"]).toBeLessThan(
		(vectorClockTick2.rows[0] as any)["time"]
	);
});

test("mutation should only be recorded if sync row is not present", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });

	await db
		.insertInto("change")
		.values({
			schema_key: "file",
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock-plugin",
			snapshot_id: "no-content",
		})
		.returningAll()
		.executeTakeFirstOrThrow();
	const mutation = await db.selectFrom("mutation_log").selectAll().execute();

	expect(mutation).toHaveLength(1);

	await db
		.insertInto("mutation_log")
		.values({
			session: "mock",
			wall_clock: 0,
			session_time: 0,
			row_id: { ignored: "ignored" },
			table_name: "mutation_log",
			operation: "INSERT",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	const mutationWithFlag = await db
		.selectFrom("mutation_log")
		.selectAll()
		.execute();
	expect(mutationWithFlag).toHaveLength(2);

	await db
		.insertInto("change")
		.values({
			schema_key: "file",
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock-plugin",
			snapshot_id: "no-content",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	const mutationLogAfterIgnoredChange = await db
		.selectFrom("mutation_log")
		.selectAll()
		.execute();
	expect(mutationLogAfterIgnoredChange).toHaveLength(2);

	// const vectorClockTick1 =
	// 	await sql`select lix_session() as session, lix_session_clock_tick() as time`.execute(
	// 		db
	// 	);
	// const vectorClockTick2 =
	// 	await sql`select lix_session() as session, lix_session_clock_tick() as time`.execute(
	// 		db
	// 	);
});

test("deleting a version cascades to version changes", async () => {
	const lix = await openLixInMemory({});
	const version = await lix.db
		.insertInto("version")
		.values({ name: "mock" })
		.returningAll()
		.executeTakeFirstOrThrow();

	const changes = await lix.db
		.insertInto("change")
		.values(
			mockChange({
				entity_id: `mock`,
			})
		)
		.returningAll()
		.execute();

	await updateChangesInVersion({
		lix,
		version,
		changes,
	});

	await lix.db.deleteFrom("version").where("id", "=", version.id).execute();

	const versionChangesAfterDelete = await lix.db
		.selectFrom("version_change")
		.where("version_change.version_id", "=", version.id)
		.selectAll()
		.execute();

	expect(versionChangesAfterDelete).toHaveLength(0);
});

test("version_change must have a unique entity_id, file_id, version_id, and schema_id", async () => {
	const lix = await openLixInMemory({});

	const version0 = await createVersion({ lix, name: "version0" });
	const version1 = await createVersion({ lix, name: "version1" });

	const mockChanges = [
		mockChange({ entity_id: "mock0", file_id: "file0", schema_key: "file" }),
	] as const;

	await lix.db.insertInto("change").values(mockChanges).execute();

	const versionChange = {
		change_id: mockChanges[0].id,
		file_id: mockChanges[0].file_id,
		entity_id: mockChanges[0].entity_id,
		schema_key: mockChanges[0].schema_key,
	};

	await lix.db
		.insertInto("version_change")
		.values({ ...versionChange, version_id: version0.id })
		.execute();

	// inserting the same change again should throw
	await expect(
		lix.db
			.insertInto("version_change")
			.values({ ...versionChange, version_id: version0.id })
			.execute()
	).rejects.toThrowErrorMatchingInlineSnapshot(
		`[SQLite3Error: SQLITE_CONSTRAINT_UNIQUE: sqlite3 result code 2067: UNIQUE constraint failed: version_change.version_id, version_change.entity_id, version_change.schema_key, version_change.file_id]`
	);

	// insert into version 1 should work
	await lix.db
		.insertInto("version_change")
		.values({ ...versionChange, version_id: version1.id })
		.execute();
});

test("versions have a unique and default human readable name", async () => {
	const lix = await openLixInMemory({});

	const version0 = await createVersion({ lix });
	const version1 = await createVersion({ lix });

	expect(version0.name).not.toBe(version1.name);

	await expect(
		createVersion({ lix, name: version0.name }),
		"version.name is unique"
	).rejects.toThrow();
});
