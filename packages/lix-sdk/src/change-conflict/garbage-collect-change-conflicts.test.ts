import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { garbageCollectChangeConflicts } from "./garbage-collect-change-conflicts.js";
import { createChangeConflict } from "./create-change-conflict.js";
import { updateBranchPointers } from "../branch/update-branch-pointers.js";

test("should not garabage collect conflicts that branch change pointers reference", async () => {
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

	const branch0 = await lix.db
		.insertInto("branch")
		.values({ id: "branch0" })
		.returningAll()
		.executeTakeFirstOrThrow();

	const mockConflict0 = await createChangeConflict({
		lix,
		key: "mock-conflict0",
		conflictingChangeIds: new Set(["change0", "change1"]),
	});

	// branch 0 points to no changes
	await updateBranchPointers({
		lix,
		branch: branch0,
		changes: [],
	});

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

test("should garbage collect conflicts that no branch change pointer references", async () => {
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

	// branch 0 points to change 0 and change 1
	await updateBranchPointers({
		lix,
		branch: currentBranch,
		changes: [changes[0]!, changes[1]!],
	});

	// Run garbage collection
	const gc0 = await garbageCollectChangeConflicts({ lix });

	expect(gc0.deletedChangeConflicts.length).toBe(0);

	// branch points to no changes anymore
	await updateBranchPointers({
		lix,
		branch: currentBranch,
		changes: [],
	});

	const gc1 = await garbageCollectChangeConflicts({ lix });
	expect(gc1.deletedChangeConflicts.length).toBe(1);
	expect(gc1.deletedChangeConflicts[0]?.id).toBe(mockConflict0.id);
});
