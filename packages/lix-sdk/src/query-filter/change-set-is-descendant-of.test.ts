import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createChangeSet } from "../change-set/create-change-set.js";
import { changeSetIsDescendantOf } from "./change-set-is-descendant-of.js";
import { changeSetIsAncestorOf } from "./change-set-is-ancestor-of.js";

test("selects all descendants excluding the current change set", async () => {
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

	// Should select cs0, cs1, cs2 as descendants of cs0
	const results = await lix.db
		.selectFrom("change_set")
		.where(changeSetIsDescendantOf(cs0))
		.select("id")
		.execute();

	expect(results.map((r) => r.id).sort()).toEqual([cs1.id, cs2.id].sort());
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
	await createChangeSet({
		lix,
		id: "cs2",
		parents: [cs1],
		changes: [],
	});

	// With depth: 1 starting from cs0, we expect cs0 and cs1 only
	const results = await lix.db
		.selectFrom("change_set")
		.where(changeSetIsDescendantOf(cs0, { depth: 1 }))
		.select("id")
		.execute();

	expect(results.map((r) => r.id).sort()).toEqual([cs1.id].sort());
});

test("can be combined with ancestor filter to select sets between two points", async () => {
	const lix = await openLixInMemory({});

	// Create a linear chain: cs0 <- cs1 <- cs2 <- cs3
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
	const cs3 = await createChangeSet({
		lix,
		id: "cs3",
		parents: [cs2],
		changes: [],
	});

	// Select change sets that are descendants of cs1 AND ancestors of cs3
	const results = await lix.db
		.selectFrom("change_set")
		.where(changeSetIsDescendantOf(cs1))
		.where(changeSetIsAncestorOf(cs3))
		.select("id")
		.execute();

	expect(results.map((r) => r.id).sort()).toEqual([cs2.id].sort());
});

test("selects descendants including the current change set when includeSelf is true", async () => {
	const lix = await openLixInMemory({});

	// Setup: cs0 <- cs1 <- cs2
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

	// Should select cs0, cs1, cs2 when includeSelf: true starting from cs0
	const results = await lix.db
		.selectFrom("change_set")
		.where(changeSetIsDescendantOf(cs0, { includeSelf: true }))
		.select("id")
		.execute();

	expect(results.map((r) => r.id).sort()).toEqual(
		[cs0.id, cs1.id, cs2.id].sort()
	);
});

test("respects depth limit when includeSelf is true", async () => {
	const lix = await openLixInMemory({});

	// Setup: cs0 <- cs1 <- cs2
	const cs0 = await createChangeSet({ lix, id: "cs0", changes: [] });
	const cs1 = await createChangeSet({
		lix,
		id: "cs1",
		parents: [cs0],
		changes: [],
	});
	await createChangeSet({
		lix,
		id: "cs2",
		parents: [cs1],
		changes: [],
	});

	// With depth: 1 and includeSelf: true starting from cs0, we expect cs0 and cs1
	const results = await lix.db
		.selectFrom("change_set")
		.where(changeSetIsDescendantOf(cs0, { depth: 1, includeSelf: true }))
		.select("id")
		.execute();

	expect(results.map((r) => r.id).sort()).toEqual([cs0.id, cs1.id].sort());
});
