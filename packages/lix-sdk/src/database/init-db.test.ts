import { createInMemoryDatabase } from "sqlite-wasm-kysely";
import { test, expect } from "vitest";
import { initDb } from "./init-db.js";
import { validate } from "uuid";

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

