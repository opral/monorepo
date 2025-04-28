// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createChangeSet } from "../change-set/create-change-set.js";
import { validate } from "uuid";

test.skip("change_proposal.id should default to uuid_v7", async () => {
	const lix = await openLixInMemory({});

	// Create some changes first
	const mockChange = await lix.db
		.insertInto("change")
		.values({
			schema_key: "file",
			entity_id: "entity1",
			file_id: "mock",
			plugin_key: "mock-plugin",
			snapshot_id: "no-content",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	// Create a change set to use in the proposal
	const changeSet = await createChangeSet({
		lix,
		elements: [
			{
				change_id: mockChange.id,
				entity_id: mockChange.entity_id,
				schema_key: mockChange.schema_key,
				file_id: mockChange.file_id,
			},
		],
	});

	// Now we can test the change proposal with valid foreign keys
	const result = await lix.db
		.insertInto("change_proposal")
		.values({
			change_set_id: changeSet.id,
			source_change_set_id: changeSet.id,
			target_change_set_id: changeSet.id,
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(validate(result.id)).toBe(true);
});

test.skip("change proposals are change controlled", async () => {
	const lix = await openLixInMemory({});

	const mockChange = await lix.db
		.insertInto("change")
		.values({
			schema_key: "file",
			entity_id: "entity1",
			file_id: "mock",
			plugin_key: "mock-plugin",
			snapshot_id: "no-content",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	// Create a change set to use in the proposal
	const changeSet = await createChangeSet({
		lix,
		elements: [
			{
				change_id: mockChange.id,
				entity_id: mockChange.entity_id,
				schema_key: mockChange.schema_key,
				file_id: mockChange.file_id,
			},
		],
	});

	const result = await lix.db
		.insertInto("change_proposal")
		.values({
			change_set_id: changeSet.id,
			source_change_set_id: changeSet.id,
			target_change_set_id: changeSet.id,
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	const change = await lix.db
		.selectFrom("change")
		.where("entity_id", "=", result.id)
		.where("schema_key", "=", "lix_change_proposal_table")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(change.entity_id).toBe(result.id);
});

test.skip("source change set id is nullable", async () => {
	const lix = await openLixInMemory({});

	const mockChange = await lix.db
		.insertInto("change")
		.values({
			schema_key: "file",
			entity_id: "entity1",
			file_id: "mock",
			plugin_key: "mock-plugin",
			snapshot_id: "no-content",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	// Create a change set to use in the proposal
	const changeSet = await createChangeSet({
		lix,
		elements: [
			{
				change_id: mockChange.id,
				entity_id: mockChange.entity_id,
				schema_key: mockChange.schema_key,
				file_id: mockChange.file_id,
			},
		],
	});

	const result = await lix.db
		.insertInto("change_proposal")
		.values({
			change_set_id: changeSet.id,
			source_change_set_id: null,
			target_change_set_id: changeSet.id,
		})
		.onConflict((oc) => oc.doNothing())
		.execute();

	expect(result).toBeDefined();
});

test.skip("target change set id is not nullable", async () => {
	const lix = await openLixInMemory({});

	const mockChange = await lix.db
		.insertInto("change")
		.values({
			schema_key: "file",
			entity_id: "entity1",
			file_id: "mock",
			plugin_key: "mock-plugin",
			snapshot_id: "no-content",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	// Create a change set to use in the proposal
	const changeSet = await createChangeSet({
		lix,
		elements: [
			{
				change_id: mockChange.id,
				entity_id: mockChange.entity_id,
				schema_key: mockChange.schema_key,
				file_id: mockChange.file_id,
			},
		],
	});

	const result = await lix.db
		.insertInto("change_proposal")
		.values({
			change_set_id: changeSet.id,
			source_change_set_id: changeSet.id,
			target_change_set_id: null,
		})
		.onConflict((oc) => oc.doNothing())
		.execute();

	expect(result).toBeDefined();
});
