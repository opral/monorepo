import { createInMemoryDatabase } from "sqlite-wasm-kysely";
import { test, expect } from "vitest";
import { initDb } from "./init-db.js";
import { validate } from "uuid";
import { mockChange } from "../change/mock-change.js";

test("file ids should default to uuid", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });

	// init the trigger function (usually defined by lix only)
	sqlite.createFunction({
		name: "triggerChangeQueue",
		arity: 0,
		// @ts-expect-error - dynamic function
		xFunc: () => {},
	});

	const file = await db
		.insertInto("file")
		.values({
			path: "/mock",
			data: new Uint8Array(),
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(validate(file.id)).toBe(true);
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
	const snapshot = await db
		.insertInto("snapshot")
		.values({
			content: { a: "value from insert statement" },
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(snapshot.id).toBe(
		"19ce22178013c4a047e8c90135ed57bfe4cc6451917dbb75f5b838922cf10b19",
	);
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
		.onConflict((oc) => oc.doUpdateSet({ content: { a: "some data" } }))
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
			})),
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
		name: "triggerChangeQueue",
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

test("change graph edges can't reference themselves", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });

	await expect(
		db
			.insertInto("change_edge")
			.values({
				parent_id: "change1",
				child_id: "change1",
			})
			.returningAll()
			.execute(),
	).rejects.toThrowErrorMatchingInlineSnapshot(
		`[SQLite3Error: SQLITE_CONSTRAINT_CHECK: sqlite3 result code 275: CHECK constraint failed: parent_id != child_id]`,
	);
});

test("change set items must be unique", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });

	await db
		.insertInto("change_set")
		.values({
			id: "change-set-1",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	await db
		.insertInto("change")
		.values(
			mockChange({
				id: "change-1",
			}),
		)
		.execute();

	await db
		.insertInto("change_set_element")
		.values({
			change_set_id: "change-set-1",
			change_id: "change-1",
		})
		.execute();

	expect(
		db
			.insertInto("change_set_element")
			.values({
				change_set_id: "change-set-1",
				change_id: "change-1",
			})
			.returningAll()
			.execute(),
	).rejects.toThrowErrorMatchingInlineSnapshot(
		`[SQLite3Error: SQLITE_CONSTRAINT_UNIQUE: sqlite3 result code 2067: UNIQUE constraint failed: change_set_element.change_set_id, change_set_element.change_id]`,
	);
});

test("creating multiple discussions for one change set should be possible", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });

	const changeSet = await db
		.insertInto("change_set")
		.defaultValues()
		.returningAll()
		.executeTakeFirstOrThrow();

	await db
		.insertInto("discussion")
		.values([
			{ id: "discussion-1", change_set_id: changeSet.id },
			{ id: "discussion-2", change_set_id: changeSet.id },
		])
		.returningAll()
		.execute();

	const discussions = await db
		.selectFrom("discussion")
		.selectAll()
		.where("change_set_id", "=", changeSet.id)
		.execute();

	expect(discussions).toHaveLength(2);
});

test("the confirmed label should be created if it doesn't exist", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });

	const tag = await db
		.selectFrom("label")
		.selectAll()
		.where("name", "=", "confirmed")
		.executeTakeFirst();

	expect(tag).toMatchObject({
		name: "confirmed",
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

	const changeSet = await db
		.insertInto("change_set")
		.defaultValues()
		.returningAll()
		.executeTakeFirstOrThrow();

	const newversion = await db
		.insertInto("version")
		.values({ name: "mock", change_set_id: changeSet.id })
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
