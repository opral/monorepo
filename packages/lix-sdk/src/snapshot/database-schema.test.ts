import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { jsonSha256 } from "./json-sha-256.js";

test("snapshot ids should default to sha256", async () => {
	const lix = await openLixInMemory({});

	const content = { a: "value" };

	const snapshot = await lix.db
		.insertInto("snapshot")
		.values({
			content,
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(snapshot.id).toBe(jsonSha256(content));
});

test("inserting the same snapshot multiple times should be possible and not lead to duplicates (content addressable)", async () => {
	const lix = await openLixInMemory({});

	const initialSnapshots = await lix.db
		.selectFrom("snapshot")
		.selectAll()
		.execute();

	const snapshot1 = await lix.db
		.insertInto("snapshot")
		.values({
			content: { a: "some data" },
		})
		.onConflict((oc) => oc.doNothing())
		.returningAll()
		.executeTakeFirstOrThrow();

	const snapshot2 = await lix.db
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

	const snapshots = await lix.db.selectFrom("snapshot").selectAll().execute();

	expect(snapshots).toHaveLength(initialSnapshots.length + 1);
	expect(snapshot1.id).toBe(snapshot2.id);
});

test("an empty snapshot should default to the special 'no-content' snapshot to store disk space", async () => {
	const lix = await openLixInMemory({});
	const snapshot = await lix.db
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
