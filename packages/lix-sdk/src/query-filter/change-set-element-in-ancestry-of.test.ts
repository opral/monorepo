import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createChangeSet } from "../change-set/create-change-set.js";
import { changeSetElementInAncestryOf } from "./change-set-element-in-ancestry-of.js";

test("returns all elements from change set and its ancestors", async () => {
	const lix = await openLixInMemory({});

	// Insert mock snapshot and change (reused across sets)
	const snapshots = await lix.db
		.insertInto("snapshot")
		.values({ content: { hello: "world" } })
		.returning("id")
		.execute();

	const changes = await lix.db
		.insertInto("change")
		.values({
			id: "c0",
			entity_id: "e1",
			file_id: "f1",
			plugin_key: "mock",
			schema_key: "mock",
			snapshot_id: snapshots[0]!.id,
		})
		.returningAll()
		.execute();

	// cs0 <- cs1 <- cs2
	const cs0 = await createChangeSet({
		lix,
		id: "cs0",
		changes: [changes[0]!],
	});
	const cs1 = await createChangeSet({
		lix,
		id: "cs1",
		parents: [cs0],
		changes: [changes[0]!],
	});
	const cs2 = await createChangeSet({
		lix,
		id: "cs2",
		parents: [cs1],
		changes: [changes[0]!],
	});

	const elements = await lix.db
		.selectFrom("change_set_element")
		.where(changeSetElementInAncestryOf(cs2))
		.select("change_set_id")
		.execute();

	expect(elements.map((e) => e.change_set_id).sort()).toEqual(
		[cs0.id, cs1.id, cs2.id].sort()
	);
});

test("respects depth limit when provided", async () => {
	const lix = await openLixInMemory({});

	const snapshots = await lix.db
		.insertInto("snapshot")
		.values({ content: { val: "hi" } })
		.returning("id")
		.execute();

	const changes = await lix.db
		.insertInto("change")
		.values({
			id: "c1",
			entity_id: "e1",
			file_id: "f1",
			plugin_key: "mock",
			schema_key: "mock",
			snapshot_id: snapshots[0]!.id,
		})
		.returningAll()
		.execute();

	// cs0 <- cs1 <- cs2
	const cs0 = await createChangeSet({
		lix,
		id: "cs0",
		changes: [changes[0]!],
	});
	const cs1 = await createChangeSet({
		lix,
		id: "cs1",
		parents: [cs0],
		changes: [changes[0]!],
	});
	const cs2 = await createChangeSet({
		lix,
		id: "cs2",
		parents: [cs1],
		changes: [changes[0]!],
	});

	const elements = await lix.db
		.selectFrom("change_set_element")
		.where(changeSetElementInAncestryOf(cs2, { depth: 1 }))
		.select("change_set_id")
		.execute();

	expect(elements.map((e) => e.change_set_id).sort()).toEqual(
		[cs1.id, cs2.id].sort()
	);
});
