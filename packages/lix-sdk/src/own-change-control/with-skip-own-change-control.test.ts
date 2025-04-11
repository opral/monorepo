import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { withSkipOwnChangeControl } from "./with-skip-own-change-control.js";

test("skipping works", async () => {
	const lix = await openLixInMemory({});

	await withSkipOwnChangeControl(lix.db, async (trx) => {
		await trx
			.insertInto("key_value")
			.values({ key: "foo", value: "bar" })
			.execute();
		await trx
			.insertInto("key_value")
			.values({ key: "foo2", value: "bar2" })
			.execute();
	});

	const keyValues = await lix.db.selectFrom("key_value").selectAll().execute();
	const changes = await lix.db
		.selectFrom("change")
		.where("schema_key", "=", "lix_key_value_table")
		.selectAll()
		.execute();

	expect(keyValues.find((kv) => kv.key === "foo")).toBeDefined();
	expect(keyValues.find((kv) => kv.key === "foo2")).toBeDefined();

	expect(changes).toHaveLength(0);
});

test("if an outside transaction sets the value to true, no conflict should arise", async () => {
	const lix = await openLixInMemory({});

	// simulating an outside transaction setting the value to true
	await withSkipOwnChangeControl(lix.db, async (trx) => {
		// and an inside transaction setting the value to true as well
		await withSkipOwnChangeControl(trx, async (trx2) => {
			await trx2
				.insertInto("key_value")
				.values({ key: "foo", value: "bar" })
				.execute();
		});
	});

	const keyValues = await lix.db.selectFrom("key_value").selectAll().execute();
	const changes = await lix.db
		.selectFrom("change")
		.where("schema_key", "=", "lix_key_value_table")
		.where("entity_id", "=", "foo")
		.selectAll()
		.execute();

	expect(changes).toHaveLength(0);
	expect(keyValues.find((kv) => kv.key === "foo")).toBeDefined();
});
