import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { changeSetElementInSymmetricDifferenceOf } from "./change-set-element-in-symmetric-difference-of.js";
import type {
	ChangeSet,
	ChangeSetElement,
} from "../change-set/database-schema.js";
import { mockChange } from "../change/mock-change.js";

// Helper function to extract necessary fields from a Change object
function getEntityChangeFields(change: any) {
	return {
		entity_id: change.entity_id,
		schema_key: change.schema_key,
		file_id: change.file_id,
	};
}

test("should return the symmetric difference between two change sets", async () => {
	const lix = await openLixInMemory({});

	// Insert test data
	const changeSetB: ChangeSet = { id: "changeSetB", immutable_elements: false };
	const changeSetA: ChangeSet = { id: "changeSetA", immutable_elements: false };

	await lix.db
		.insertInto("change_set")
		.values([changeSetA, changeSetB])
		.execute();

	const changes = await lix.db
		.insertInto("change")
		.values([
			mockChange({
				id: "change1",
				entity_id: "e1",
				schema_key: "s1",
				file_id: "f1",
			}),
			mockChange({
				id: "change2",
				entity_id: "e2",
				schema_key: "s2",
				file_id: "f2",
			}),
			mockChange({
				id: "change3",
				entity_id: "e3",
				schema_key: "s3",
				file_id: "f3",
			}),
			mockChange({
				id: "change4",
				entity_id: "e4",
				schema_key: "s4",
				file_id: "f4",
			}),
		])
		.returningAll()
		.execute();

	const changeMap = new Map(changes.map((c) => [c.id, c]));

	// Setup: Create change set elements
	const changeElementsA: ChangeSetElement[] = [
		{
			change_set_id: "changeSetA",
			change_id: "change1",
			...getEntityChangeFields(changeMap.get("change1")!),
		},
		{
			change_set_id: "changeSetA",
			change_id: "change2",
			...getEntityChangeFields(changeMap.get("change2")!),
		},
	];

	const changeElementsB: ChangeSetElement[] = [
		{
			change_set_id: "changeSetB",
			change_id: "change2",
			...getEntityChangeFields(changeMap.get("change2")!),
		},
		{
			change_set_id: "changeSetB",
			change_id: "change3",
			...getEntityChangeFields(changeMap.get("change3")!),
		},
	];

	await lix.db
		.insertInto("change_set_element")
		.values([...changeElementsA, ...changeElementsB])
		.execute();

	const result = await lix.db
		.selectFrom("change_set_element")
		.where(changeSetElementInSymmetricDifferenceOf(changeSetA, changeSetB))
		.selectAll()
		.execute();

	expect(result).toEqual([
		// change 1 is in A but not in B
		expect.objectContaining({
			change_set_id: "changeSetA",
			change_id: "change1",
			entity_id: "e1",
			schema_key: "s1",
			file_id: "f1",
		}),
		// change 3 is in B but not in A
		expect.objectContaining({
			change_set_id: "changeSetB",
			change_id: "change3",
			entity_id: "e3",
			schema_key: "s3",
			file_id: "f3",
		}),
	]);
});

test("should return an empty array if there are no differences", async () => {
	const lix = await openLixInMemory({});

	// Insert test data
	const changeSetA: ChangeSet = { id: "changeSetA", immutable_elements: false };
	const changeSetB: ChangeSet = { id: "changeSetB", immutable_elements: false };

	await lix.db
		.insertInto("change_set")
		.values([changeSetA, changeSetB])
		.execute();

	const changes = await lix.db
		.insertInto("change")
		.values([
			mockChange({
				id: "change1",
				entity_id: "e1",
				schema_key: "s1",
				file_id: "f1",
			}),
			mockChange({
				id: "change2",
				entity_id: "e2",
				schema_key: "s2",
				file_id: "f2",
			}),
			mockChange({
				id: "change3",
				entity_id: "e3",
				schema_key: "s3",
				file_id: "f3",
			}),
			mockChange({
				id: "change4",
				entity_id: "e4",
				schema_key: "s4",
				file_id: "f4",
			}),
		])
		.returningAll()
		.execute();

	const changeMap = new Map(changes.map((c) => [c.id, c]));

	const sharedChangeElements: ChangeSetElement[] = [
		{
			change_set_id: "changeSetA",
			change_id: "change1",
			...getEntityChangeFields(changeMap.get("change1")!),
		},
		{
			change_set_id: "changeSetA",
			change_id: "change2",
			...getEntityChangeFields(changeMap.get("change2")!),
		},
		{
			change_set_id: "changeSetB",
			change_id: "change1",
			...getEntityChangeFields(changeMap.get("change1")!),
		},
		{
			change_set_id: "changeSetB",
			change_id: "change2",
			...getEntityChangeFields(changeMap.get("change2")!),
		},
	];

	await lix.db
		.insertInto("change_set_element")
		.values(sharedChangeElements)
		.execute();

	const result = await lix.db
		.selectFrom("change_set_element")
		.where(changeSetElementInSymmetricDifferenceOf(changeSetA, changeSetB))
		.selectAll()
		.execute();

	expect(result).toEqual([]);
});

test("should handle empty change sets", async () => {
	const lix = await openLixInMemory({});

	// Insert test data
	const changeSetA: ChangeSet = { id: "changeSetA", immutable_elements: false };
	const changeSetB: ChangeSet = { id: "changeSetB", immutable_elements: false };

	await lix.db
		.insertInto("change_set")
		.values([changeSetA, changeSetB])
		.execute();

	const result = await lix.db
		.selectFrom("change_set_element")
		.where(changeSetElementInSymmetricDifferenceOf(changeSetA, changeSetB))
		.selectAll()
		.execute();

	// Verify the results
	expect(result).toEqual([]);
});

test("should handle disjoint change sets", async () => {
	const lix = await openLixInMemory({});

	// Insert test data
	const changeSetA: ChangeSet = { id: "changeSetA", immutable_elements: false };
	const changeSetB: ChangeSet = { id: "changeSetB", immutable_elements: false };

	await lix.db
		.insertInto("change_set")
		.values([changeSetA, changeSetB])
		.execute();

	const changes = await lix.db
		.insertInto("change")
		.values([
			mockChange({
				id: "change1",
				entity_id: "e1",
				schema_key: "s1",
				file_id: "f1",
			}),
			mockChange({
				id: "change2",
				entity_id: "e2",
				schema_key: "s2",
				file_id: "f2",
			}),
			mockChange({
				id: "change3",
				entity_id: "e3",
				schema_key: "s3",
				file_id: "f3",
			}),
			mockChange({
				id: "change4",
				entity_id: "e4",
				schema_key: "s4",
				file_id: "f4",
			}),
		])
		.returningAll()
		.execute();

	const changeMap = new Map(changes.map((c) => [c.id, c]));

	const disjointChangeElementsA: ChangeSetElement[] = [
		{
			change_set_id: "changeSetA",
			change_id: "change1",
			...getEntityChangeFields(changeMap.get("change1")!),
		},
		{
			change_set_id: "changeSetA",
			change_id: "change2",
			...getEntityChangeFields(changeMap.get("change2")!),
		},
	];
	const disjointChangeElementsB: ChangeSetElement[] = [
		{
			change_set_id: "changeSetB",
			change_id: "change3",
			...getEntityChangeFields(changeMap.get("change3")!),
		},
		{
			change_set_id: "changeSetB",
			change_id: "change4",
			...getEntityChangeFields(changeMap.get("change4")!),
		},
	];

	await lix.db
		.insertInto("change_set_element")
		.values([...disjointChangeElementsA, ...disjointChangeElementsB])
		.execute();

	// Expected result: Symmetric difference includes all elements as sets are disjoint
	const expectedResult: ChangeSetElement[] = [
		...disjointChangeElementsA,
		...disjointChangeElementsB,
	];

	const result = await lix.db
		.selectFrom("change_set_element")
		.where(changeSetElementInSymmetricDifferenceOf(changeSetA, changeSetB))
		.selectAll()
		.execute();

	expect(result).toEqual(expectedResult);
});
