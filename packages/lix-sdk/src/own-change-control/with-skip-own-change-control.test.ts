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

test("nested withSkipOwnChangeControl obeys to the outer transaction", async () => {
	const lix = await openLixInMemory({});

	await withSkipOwnChangeControl(lix.db, async (outer) => {
		await withSkipOwnChangeControl(outer, async (inner) => {
			await inner
				.insertInto("key_value")
				.values({ key: "nested_key", value: "nested_value" })
				.execute();

			const innerSkip = await inner
				.selectFrom("key_value")
				.select("value")
				.where("key", "=", "lix_skip_own_change_control")
				.executeTakeFirst();

			expect(innerSkip?.value).toBe("2");
		});
		await outer
			.updateTable("key_value")
			.set({ key: "nested_key", value: "nested_value2" })
			.where("key", "=", "nested_key")
			.execute();

		const outerSkip = await outer
			.selectFrom("key_value")
			.select("value")
			.where("key", "=", "lix_skip_own_change_control")
			.executeTakeFirst();

		expect(outerSkip?.value).toBe("1");
	});

	const keyValues = await lix.db.selectFrom("key_value").selectAll().execute();
	const changes = await lix.db
		.selectFrom("change")
		.where("schema_key", "=", "lix_key_value_table")
		.where("entity_id", "=", "nested_key")
		.selectAll()
		.execute();

	expect(changes).toHaveLength(0);
	expect(keyValues.find((kv) => kv.key === "nested_key")).toBeDefined();
	expect(
		keyValues.find((kv) => kv.key === "lix_skip_own_change_control")
	).toBeUndefined();
});
