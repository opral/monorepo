import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { changeSetElementInSymmetricDifference } from "./change-set-element-in-symmetric-difference.js";
import type { ChangeSet, ChangeSetElement } from "../database/schema.js";
import { mockChange } from "../change/mock-change.js";

test("should return the symmetric difference between two change sets", async () => {
	const lix = await openLixInMemory({});

	// Insert test data
	const changeSetA: ChangeSet = { id: "changeSetA" };
	const changeSetB: ChangeSet = { id: "changeSetB" };

	await lix.db
		.insertInto("change_set")
		.values([changeSetA, changeSetB])
		.execute();

	await lix.db
		.insertInto("change")
		.values([
			mockChange({ id: "change1" }),
			mockChange({ id: "change2" }),
			mockChange({ id: "change3" }),
			mockChange({ id: "change4" }),
		])
		.returningAll()
		.execute();

	const changesA: ChangeSetElement[] = [
		{ change_set_id: "changeSetA", change_id: "change1" },
		{ change_set_id: "changeSetA", change_id: "change2" },
	];

	const changesB: ChangeSetElement[] = [
		{ change_set_id: "changeSetB", change_id: "change2" },
		{ change_set_id: "changeSetB", change_id: "change3" },
	];

	await lix.db
		.insertInto("change_set_element")
		.values([...changesA, ...changesB])
		.execute();

	const result = await lix.db
		.selectFrom("change_set_element")
		.where(changeSetElementInSymmetricDifference(changeSetA, changeSetB))
		.selectAll()
		.execute();

	expect(result).toEqual([
		// change 1 is in A but not in B
		{ change_set_id: "changeSetA", change_id: "change1" },
		// change 3 is in B but not in A
		{ change_set_id: "changeSetB", change_id: "change3" },
		// change 4 is in neither A nor B
		// hence not in the symmetric difference
	]);
});

test("should return an empty array if there are no differences", async () => {
	const lix = await openLixInMemory({});

	// Insert test data
	const changeSetA: ChangeSet = { id: "changeSetA" };
	const changeSetB: ChangeSet = { id: "changeSetB" };

	await lix.db
		.insertInto("change_set")
		.values([changeSetA, changeSetB])
		.execute();

	await lix.db
		.insertInto("change")
		.values([
			mockChange({ id: "change1" }),
			mockChange({ id: "change2" }),
			mockChange({ id: "change3" }),
			mockChange({ id: "change4" }),
		])
		.returningAll()
		.execute();

	const changes: ChangeSetElement[] = [
		{ change_set_id: "changeSetA", change_id: "change1" },
		{ change_set_id: "changeSetA", change_id: "change2" },
		{ change_set_id: "changeSetB", change_id: "change1" },
		{ change_set_id: "changeSetB", change_id: "change2" },
	];

	await lix.db.insertInto("change_set_element").values(changes).execute();

	const result = await lix.db
		.selectFrom("change_set_element")
		.where(changeSetElementInSymmetricDifference(changeSetA, changeSetB))
		.selectAll()
		.execute();

	expect(result).toEqual([]);
});

test("should handle empty change sets", async () => {
	const lix = await openLixInMemory({});

	// Insert test data
	const changeSetA: ChangeSet = { id: "changeSetA" };
	const changeSetB: ChangeSet = { id: "changeSetB" };

	await lix.db
		.insertInto("change_set")
		.values([changeSetA, changeSetB])
		.execute();

	const result = await lix.db
		.selectFrom("change_set_element")
		.where(changeSetElementInSymmetricDifference(changeSetA, changeSetB))
		.selectAll()
		.execute();

	// Verify the results
	expect(result).toEqual([]);
});
