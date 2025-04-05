import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createChangeSet } from "../change-set/create-change-set.js";
import { changeSetIsAncestorOf } from "./change-set-is-ancestor-of.js";

test("selects all ancestors of the current change set", async () => {
	const lix = await openLixInMemory({});

	// Create a linear chain of change sets: cs0 <- cs1 <- cs2
	const cs0 = await createChangeSet({ lix, id: "cs0", changes: [] });
	const cs1 = await createChangeSet({
		lix,
		id: "cs1",
		parents: [cs0],
		changes: [],
	});
	const cs2 = await createChangeSet({
		lix,
		id: "cs2",
		parents: [cs1],
		changes: [],
	});

	// Should select cs0, cs1 as ancestors of cs2
	const results = await lix.db
		.selectFrom("change_set")
		.where(changeSetIsAncestorOf(cs2))
		.select("id")
		.execute();

	expect(results.map((r) => r.id).sort()).toEqual(
		[cs0.id, cs1.id].sort()
	);
});

test("respects the optional depth limit", async () => {
	const lix = await openLixInMemory({});

	// cs0 <- cs1 <- cs2
	const cs0 = await createChangeSet({ lix, id: "cs0", changes: [] });
	const cs1 = await createChangeSet({
		lix,
		id: "cs1",
		parents: [cs0],
		changes: [],
	});
	const cs2 = await createChangeSet({
		lix,
		id: "cs2",
		parents: [cs1],
		changes: [],
	});

	// With depth: 1, we expect cs1 only
	const results = await lix.db
		.selectFrom("change_set")
		.where(changeSetIsAncestorOf(cs2, { depth: 1 }))
		.select("id")
		.execute();

	expect(results.map((r) => r.id).sort()).toEqual([cs1.id].sort());
});

test("inclusive true selects the current change set as well", async () => {
	const lix = await openLixInMemory({});

	// cs0 <- cs1 <- cs2
	const cs0 = await createChangeSet({ lix, id: "cs0", changes: [] });
	const cs1 = await createChangeSet({
		lix,
		id: "cs1",
		parents: [cs0],
		changes: [],
	});
	const cs2 = await createChangeSet({
		lix,
		id: "cs2",
		parents: [cs1],
		changes: [],
	});

	// Should select cs0, cs1, cs2
	const results = await lix.db
		.selectFrom("change_set")
		.where(changeSetIsAncestorOf(cs2, { inclusive: true }))
		.select("id")
		.execute();

	expect(results.map((r) => r.id).sort()).toEqual(
		[cs0.id, cs1.id, cs2.id].sort()
	);
})