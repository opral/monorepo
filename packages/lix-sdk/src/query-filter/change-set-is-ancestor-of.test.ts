import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createChangeSet } from "../change-set-v2/create-change-set.js";
import { changeSetIsAncestorOf } from "./change-set-is-ancestor-of.js";

test("selects all ancestors of the current change set", async () => {
	const lix = await openLixInMemory({});

	// Create a linear chain of change sets: cs0 <- cs1 <- cs2
	const cs0 = await createChangeSet({
		lix,
		id: "cs0",
		elements: [],
	});
	const cs1 = await createChangeSet({
		lix,
		id: "cs1",
		elements: [],
		parents: [cs0],
	});
	const cs2 = await createChangeSet({
		lix,
		id: "cs2",
		elements: [],
		parents: [cs1],
	});

	// Should select cs0, cs1 as ancestors of cs2
	const results = await lix.db
		.selectFrom("change_set")
		.where(changeSetIsAncestorOf(cs2))
		.select("id")
		.execute();

	expect(results.map((r) => r.id).sort()).toEqual([cs0.id, cs1.id].sort());
});

test("respects the optional depth limit", async () => {
	const lix = await openLixInMemory({});

	// cs0 <- cs1 <- cs2
	const cs0 = await createChangeSet({
		lix,
		id: "cs0",
		elements: [],
	});
	const cs1 = await createChangeSet({
		lix,
		id: "cs1",
		elements: [],
		parents: [cs0],
	});
	const cs2 = await createChangeSet({
		lix,
		id: "cs2",
		elements: [],
		parents: [cs1],
	});

	// With depth: 1, we expect cs1 only
	const results = await lix.db
		.selectFrom("change_set")
		.where(changeSetIsAncestorOf(cs2, { depth: 1 }))
		.select("id")
		.execute();

	expect(results.map((r) => r.id).sort()).toEqual([cs1.id].sort());
});

test("includeSelf true selects the current change set as well", async () => {
	const lix = await openLixInMemory({});

	// cs0 <- cs1 <- cs2
	const cs0 = await createChangeSet({
		lix,
		id: "cs0",
		elements: [],
	});
	const cs1 = await createChangeSet({
		lix,
		id: "cs1",
		elements: [],
		parents: [cs0],
	});
	const cs2 = await createChangeSet({
		lix,
		id: "cs2",
		elements: [],
		parents: [cs1],
	});

	// Should select cs0, cs1, cs2
	const results = await lix.db
		.selectFrom("change_set")
		.where(changeSetIsAncestorOf(cs2, { includeSelf: true }))
		.select("id")
		.execute();

	expect(results.map((r) => r.id).sort()).toEqual(
		[cs0.id, cs1.id, cs2.id].sort()
	);
});

test("can be combined with where(id = X) to check specific ancestry", async () => {
	const lix = await openLixInMemory({});

	// Create chain: cs1 <- cs2 <- cs3
	const cs1 = await createChangeSet({
		lix,
		id: "cs1", 
		elements: [],
	});
	const cs2 = await createChangeSet({
		lix,
		id: "cs2",
		elements: [],
		parents: [cs1],
	});
	const cs3 = await createChangeSet({
		lix,
		id: "cs3",
		elements: [],
		parents: [cs2],
	});

	// Test: Check if cs2 is an ancestor of cs3 (should return cs2)
	const cs2IsAncestorOfCs3 = await lix.db
		.selectFrom("change_set")
		.where("id", "=", cs2.id)
		.where(changeSetIsAncestorOf(cs3))
		.select("id")
		.execute();

	expect(cs2IsAncestorOfCs3).toHaveLength(1);
	expect(cs2IsAncestorOfCs3[0]!.id).toBe(cs2.id);

	// Test: Check if cs1 is an ancestor of cs3 (should return cs1)
	const cs1IsAncestorOfCs3 = await lix.db
		.selectFrom("change_set")
		.where("id", "=", cs1.id)
		.where(changeSetIsAncestorOf(cs3))
		.select("id")
		.execute();

	expect(cs1IsAncestorOfCs3).toHaveLength(1);
	expect(cs1IsAncestorOfCs3[0]!.id).toBe(cs1.id);

	// Test: Check if cs3 is an ancestor of cs3 (should return empty - not inclusive by default)
	const cs3IsAncestorOfCs3 = await lix.db
		.selectFrom("change_set")
		.where("id", "=", cs3.id)
		.where(changeSetIsAncestorOf(cs3))
		.select("id")
		.execute();

	expect(cs3IsAncestorOfCs3).toHaveLength(0);

	// Test: Check if cs3 is an ancestor of cs1 (should return empty - wrong direction)
	const cs3IsAncestorOfCs1 = await lix.db
		.selectFrom("change_set")
		.where("id", "=", cs3.id)
		.where(changeSetIsAncestorOf(cs1))
		.select("id")
		.execute();

	expect(cs3IsAncestorOfCs1).toHaveLength(0);

	// Test: Check with includeSelf option
	const cs3IsAncestorOfCs3Inclusive = await lix.db
		.selectFrom("change_set")
		.where("id", "=", cs3.id)
		.where(changeSetIsAncestorOf(cs3, { includeSelf: true }))
		.select("id")
		.execute();

	expect(cs3IsAncestorOfCs3Inclusive).toHaveLength(1);
	expect(cs3IsAncestorOfCs3Inclusive[0]!.id).toBe(cs3.id);
});
