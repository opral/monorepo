import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { changeSetElementInSymmetricDifference } from "./change-set-element-in-symmetric-difference.js";
import type {
	NewChangeSetElement,
} from "../change-set/schema.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";

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

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		type: "object",
	};

	// Insert test data
	const changeSetB = { id: "changeSetB" };
	const changeSetA = { id: "changeSetA" };

	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();

	await lix.db
		.insertInto("change_set")
		.values([changeSetA, changeSetB])
		.execute();

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "change1",
				entity_id: "e1",
				schema_key: "mock_schema",
				file_id: "f1",
				plugin_key: "test-plugin",
				schema_version: "1.0",
				snapshot_id: "no-content",
			},
			{
				id: "change2",
				entity_id: "e2",
				schema_key: "mock_schema",
				file_id: "f2",
				plugin_key: "test-plugin",
				schema_version: "1.0",
				snapshot_id: "no-content",
			},
			{
				id: "change3",
				entity_id: "e3",
				schema_key: "mock_schema",
				file_id: "f3",
				plugin_key: "test-plugin",
				schema_version: "1.0",
				snapshot_id: "no-content",
			},
			{
				id: "change4",
				entity_id: "e4",
				schema_key: "mock_schema",
				file_id: "f4",
				plugin_key: "test-plugin",
				schema_version: "1.0",
				snapshot_id: "no-content",
			},
		])
		.returningAll()
		.execute();

	const changeMap = new Map(changes.map((c) => [c.id, c]));

	// Setup: Create change set elements
	const changeElementsA: NewChangeSetElement[] = [
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

	const changeElementsB: NewChangeSetElement[] = [
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
		.where(changeSetElementInSymmetricDifference(changeSetA, changeSetB))
		.selectAll()
		.execute();

	expect(result).toEqual([
		// change 1 is in A but not in B
		expect.objectContaining({
			change_set_id: "changeSetA",
			change_id: "change1",
			entity_id: "e1",
			schema_key: "mock_schema",
			file_id: "f1",
		}),
		// change 3 is in B but not in A
		expect.objectContaining({
			change_set_id: "changeSetB",
			change_id: "change3",
			entity_id: "e3",
			schema_key: "mock_schema",
			file_id: "f3",
		}),
	]);
});

test("should return an empty array if there are no differences", async () => {
	const lix = await openLixInMemory({});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		type: "object",
	};

	// Insert test data
	const changeSetA = { id: "changeSetA" };
	const changeSetB = { id: "changeSetB" };

	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();

	await lix.db
		.insertInto("change_set")
		.values([changeSetA, changeSetB])
		.execute();

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "change1",
				entity_id: "e1",
				schema_key: "mock_schema",
				file_id: "f1",
				plugin_key: "test-plugin",
				schema_version: "1.0",
				snapshot_id: "no-content",
			},
			{
				id: "change2",
				entity_id: "e2",
				schema_key: "mock_schema",
				file_id: "f2",
				plugin_key: "test-plugin",
				schema_version: "1.0",
				snapshot_id: "no-content",
			},
			{
				id: "change3",
				entity_id: "e3",
				schema_key: "mock_schema",
				file_id: "f3",
				plugin_key: "test-plugin",
				schema_version: "1.0",
				snapshot_id: "no-content",
			},
			{
				id: "change4",
				entity_id: "e4",
				schema_key: "mock_schema",
				file_id: "f4",
				plugin_key: "test-plugin",
				schema_version: "1.0",
				snapshot_id: "no-content",
			},
		])
		.returningAll()
		.execute();

	const changeMap = new Map(changes.map((c) => [c.id, c]));

	const sharedChangeElements: NewChangeSetElement[] = [
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
		.where(changeSetElementInSymmetricDifference(changeSetA, changeSetB))
		.selectAll()
		.execute();

	expect(result).toEqual([]);
});

test("should handle empty change sets", async () => {
	const lix = await openLixInMemory({});

	// Insert test data
	const changeSetA = { id: "changeSetA" };
	const changeSetB = { id: "changeSetB" };

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

test("should handle disjoint change sets", async () => {
	const lix = await openLixInMemory({});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		type: "object",
	};

	// Insert test data
	const changeSetA = { id: "changeSetA" };
	const changeSetB = { id: "changeSetB" };

	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();

	await lix.db
		.insertInto("change_set")
		.values([changeSetA, changeSetB])
		.execute();

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "change1",
				entity_id: "e1",
				schema_key: "mock_schema",
				file_id: "f1",
				plugin_key: "test-plugin",
				schema_version: "1.0",
				snapshot_id: "no-content",
			},
			{
				id: "change2",
				entity_id: "e2",
				schema_key: "mock_schema",
				file_id: "f2",
				plugin_key: "test-plugin",
				schema_version: "1.0",
				snapshot_id: "no-content",
			},
			{
				id: "change3",
				entity_id: "e3",
				schema_key: "mock_schema",
				file_id: "f3",
				plugin_key: "test-plugin",
				schema_version: "1.0",
				snapshot_id: "no-content",
			},
			{
				id: "change4",
				entity_id: "e4",
				schema_key: "mock_schema",
				file_id: "f4",
				plugin_key: "test-plugin",
				schema_version: "1.0",
				snapshot_id: "no-content",
			},
		])
		.returningAll()
		.execute();

	const changeMap = new Map(changes.map((c) => [c.id, c]));

	const disjointChangeElementsA: NewChangeSetElement[] = [
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
	const disjointChangeElementsB: NewChangeSetElement[] = [
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

	const result = await lix.db
		.selectFrom("change_set_element")
		.where(changeSetElementInSymmetricDifference(changeSetA, changeSetB))
		.selectAll()
		.execute();

	// Expected result: Symmetric difference includes all elements as sets are disjoint
	expect(result).toEqual([
		expect.objectContaining({
			change_set_id: "changeSetA",
			change_id: "change1",
			entity_id: "e1",
			schema_key: "mock_schema",
			file_id: "f1",
		}),
		expect.objectContaining({
			change_set_id: "changeSetA",
			change_id: "change2",
			entity_id: "e2",
			schema_key: "mock_schema",
			file_id: "f2",
		}),
		expect.objectContaining({
			change_set_id: "changeSetB",
			change_id: "change3",
			entity_id: "e3",
			schema_key: "mock_schema",
			file_id: "f3",
		}),
		expect.objectContaining({
			change_set_id: "changeSetB",
			change_id: "change4",
			entity_id: "e4",
			schema_key: "mock_schema",
			file_id: "f4",
		}),
	]);
});
