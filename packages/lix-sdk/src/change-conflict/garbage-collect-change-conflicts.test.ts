import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { garbageCollectChangeConflicts } from "./garbage-collect-change-conflicts.js";
import { createChangeConflict } from "./create-change-conflict.js";

test("should garbage collect conflicts that no branch change pointers reference", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("change")
		.values([
			{
				id: "change0",
				plugin_key: "mock-plugin",
				type: "mock",
				file_id: "mock",
				entity_id: "value0",
				snapshot_id: "no-content",
			},
			{
				id: "change1",
				plugin_key: "mock-plugin",
				type: "mock",
				file_id: "mock",
				entity_id: "value1",
				snapshot_id: "no-content",
			},
		])
		.returningAll()
		.execute();

	const mockConflict0 = await createChangeConflict({
		lix,
		key: "mock-conflict0",
		conflictingChangeIds: new Set(["change0", "change1"]),
	});

	const branchChangePointers = await lix.db
		.selectFrom("branch_change_pointer")
		.selectAll()
		.execute();

	expect(branchChangePointers.length).toBe(0);

	// Run garbage collection
	const gc = await garbageCollectChangeConflicts({ lix });

	expect(gc.deletedChangeConflicts.length).toBe(1);
	expect(gc.deletedChangeConflicts[0]?.id).toBe(mockConflict0.id);

	// Check remaining conflicts
	const remainingConflicts = await lix.db
		.selectFrom("change_conflict")
		.selectAll()
		.execute();

	expect(remainingConflicts.length).toBe(0);

	// Check remaining conflict elements
	const remainingConflictElements = await lix.db
		.selectFrom("change_conflict_element")
		.selectAll()
		.execute();

	expect(remainingConflictElements.length).toBe(0);
});

test("should not garbage collect conflicts that branch change pointers reference", async () => {
	const lix = await openLixInMemory({});

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "change0",
				plugin_key: "mock-plugin",
				type: "mock",
				file_id: "mock",
				entity_id: "value0",
				snapshot_id: "no-content",
			},
			{
				id: "change1",
				plugin_key: "mock-plugin",
				type: "mock",
				file_id: "mock",
				entity_id: "value1",
				snapshot_id: "no-content",
			},
		])
		.returningAll()
		.execute();

	const currentBranch = await lix.db
		.selectFrom("current_branch")
		.selectAll()
		.executeTakeFirstOrThrow();

	const mockConflict0 = await createChangeConflict({
		lix,
		key: "mock-conflict0",
		conflictingChangeIds: new Set(["change0", "change1"]),
	});

	// current branch points to changes 0 and 1
	await lix.db
		.insertInto("branch_change_pointer")
		.values([
			{
				branch_id: currentBranch.id,
				change_id: changes[0]!.id,
				change_entity_id: changes[0]!.entity_id,
				change_file_id: changes[0]!.file_id,
				change_type: changes[0]!.type,
			},
			{
				branch_id: currentBranch.id,
				change_id: changes[1]!.id,
				change_entity_id: changes[1]!.entity_id,
				change_file_id: changes[1]!.file_id,
				change_type: changes[1]!.type,
			},
		])
		.execute();

	// Run garbage collection
	const gc0 = await garbageCollectChangeConflicts({ lix });

	expect(gc0.deletedChangeConflicts.length).toBe(0);

	// delete all branch change pointers
	await lix.db.deleteFrom("branch_change_pointer").execute();

	const gc1 = await garbageCollectChangeConflicts({ lix });
	expect(gc1.deletedChangeConflicts.length).toBe(1);
	expect(gc1.deletedChangeConflicts[0]?.id).toBe(mockConflict0.id);
});
