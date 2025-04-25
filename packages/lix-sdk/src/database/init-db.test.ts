import { createInMemoryDatabase } from "sqlite-wasm-kysely";
import { test, expect } from "vitest";
import { initDb } from "./init-db.js";
import { validate } from "uuid";
import { jsonSha256 } from "../snapshot/json-sha-256.js";

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

