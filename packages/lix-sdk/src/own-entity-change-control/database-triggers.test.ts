import { expect, test } from "vitest";
import { applyOwnEntityChangeControlTriggers } from "./database-triggers.js";
import { createInMemoryDatabase } from "sqlite-wasm-kysely";
import { handleLixOwnEntityChange } from "./handle-lix-own-entity-change.js";
import { initDb } from "../database/init-db.js";

test("should apply own entity change control triggers", async () => {
	const sqlite = await createInMemoryDatabase({});
	const db = initDb({ sqlite });

	sqlite.createFunction({
		name: "handle_lix_own_entity_change",
		arity: -1,
		// @ts-expect-error - dynamic function
		xFunc: (_ctx: number, tableName: string, ...value) => {
			handleLixOwnEntityChange(db, tableName, ...value);
		},
	});

	applyOwnEntityChangeControlTriggers(sqlite);

	await db
		.insertInto("key_value")
		.values({ key: "key1", value: "value1" })
		.execute();

	await new Promise((resolve) => setTimeout(resolve, 100));

	const changes = await db.selectFrom("change").selectAll().execute();
	const snapshot = await db
		.selectFrom("snapshot")
		.where("id", "=", changes[0]!.snapshot_id!)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(changes.length).toBe(1);
	expect(changes[0]?.entity_id).toBe("key1");
	expect(changes[0]?.file_id).toBe("null");
	expect(changes[0]?.plugin_key).toBe("lix-own-entity");
	expect(changes[0]?.schema_key).toBe("lix-key-value-v1");
	expect(snapshot.content).toStrictEqual({ key: "key1", value: "value1" });
});
