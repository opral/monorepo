import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createChangeSet } from "../change-set/create-change-set.js";
import { createChangeProposal } from "./create-change-proposal.js";

test.skip("creating a change proposal should compute the symmetric difference", async () => {
	const lix = await openLixInMemory({});

	// Create some changes for change sets
	const mockChanges = await lix.db
		.insertInto("change")
		.values([
			// Change 1 - only in source change set
			{
				schema_key: "file",
				schema_version: "1.0",
				entity_id: "value1",
				file_id: "mock1",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			},
			// Change 2 - in both source and target (so not in symmetric difference)
			{
				schema_key: "file",
				schema_version: "1.0",
				entity_id: "value2",
				file_id: "mock2",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			},
			// Change 3 - only in target change set
			{
				schema_key: "file",
				entity_id: "value3",
				file_id: "mock3",
				schema_version: "1.0",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			},
		])
		.returningAll()
		.execute();

	// Create source change set with changes 1 and 2
	const sourceChangeSet = await createChangeSet({
		lix: lix,
		elements: mockChanges.slice(0, 2).map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
	});

	// Create target change set with changes 2 and 3
	const targetChangeSet = await createChangeSet({
		lix: lix,
		elements: mockChanges.slice(1, 3).map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
	});

	// Create a change proposal
	const proposal = await createChangeProposal({
		lix: lix,
		sourceChangeSet: sourceChangeSet,
		targetChangeSet: targetChangeSet,
	});

	// Verify the change proposal was created with the correct data
	expect(proposal).toMatchObject({
		id: expect.any(String),
		source_change_set_id: sourceChangeSet.id,
		target_change_set_id: targetChangeSet.id,
	});

	// The change_set_id should be a new change set
	expect(proposal.change_set_id).not.toBe(sourceChangeSet.id);
	expect(proposal.change_set_id).not.toBe(targetChangeSet.id);

	// Verify the new change set contains only the changes in the symmetric difference
	const changeSetElements = await lix.db
		.selectFrom("change_set_element")
		.selectAll()
		.where("change_set_id", "=", proposal.change_set_id)
		.execute();

	// Should have 2 changes: change1 and change3, but not change2 (which is in both sets)
	expect(changeSetElements).toHaveLength(2);

	// Expected change IDs: the first and third change
	const expectedChangeIds = [mockChanges[0]!.id, mockChanges[2]!.id];

	// Verify that both expected change IDs are in the result
	expect(changeSetElements.map((el) => el.change_id)).toEqual(
		expect.arrayContaining(expectedChangeIds)
	);

	// Verify no other changes are included (particularly not the common change)
	expect(
		changeSetElements.some((el) => el.change_id === mockChanges[1]!.id)
	).toBe(false);
});
