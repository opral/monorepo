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

	console.log(changes);
	expect(changes).toHaveLength(0);
});
