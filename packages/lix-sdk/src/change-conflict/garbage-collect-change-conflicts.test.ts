import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { garbageCollectChangeConflicts } from "./garbage-collect-change-conflicts.js";
import { createChangeConflict } from "./create-change-conflict.js";

test("should garbage collect conflicts that contain one or more changes that no branch change pointer references (anymore)", async () => {
	const lix = await openLixInMemory({});

	const branch0 = await lix.db
		.insertInto("branch")
		.values([{ id: "branch0", name: "branch0" }])
		.returningAll()
		.executeTakeFirstOrThrow();

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "change0",
				plugin_key: "mock-plugin",
				schema_key: "mock",
				file_id: "mock",
				entity_id: "value0",
				snapshot_id: "no-content",
			},
			{
				id: "change1",
				plugin_key: "mock-plugin",
				schema_key: "mock",
				file_id: "mock",
				entity_id: "value1",
				snapshot_id: "no-content",
			},
			{
				id: "change2",
				plugin_key: "mock-plugin",
				schema_key: "mock",
				file_id: "mock",
				entity_id: "value2",
				snapshot_id: "no-content",
			},
		])
		.returningAll()
		.execute();

	// Create change conflicts
	const mockConflict0 = await createChangeConflict({
		lix,
		branch: branch0,
		key: "mock-conflict0",
		conflictingChangeIds: new Set(["change0", "change1"]),
	});

	await createChangeConflict({
		lix,
		branch: branch0,
		key: "mock-conflict1",
		conflictingChangeIds: new Set(["change1", "change2"]),
	});

	// Insert branch change pointers (only for change0 and change1)
	await lix.db
		.insertInto("branch_change_pointer")
		.values([
			{
				branch_id: branch0.id,
				change_id: changes[0]!.id,
				change_entity_id: changes[0]!.entity_id,
				change_file_id: changes[0]!.file_id,
				change_schema_key: changes[0]!.schema_key,
			},
			{
				branch_id: branch0.id,
				change_id: changes[1]!.id,
				change_entity_id: changes[1]!.entity_id,
				change_file_id: changes[1]!.file_id,
				change_schema_key: changes[1]!.schema_key,
			},
		])
		.execute();

	// Run garbage collection
	await garbageCollectChangeConflicts({ lix });

	// Check remaining conflicts
	const remainingConflicts = await lix.db
		.selectFrom("change_conflict")
		.selectAll()
		.execute();

	expect(remainingConflicts.length).toBe(1);
	expect(remainingConflicts[0]?.id).toBe(mockConflict0.id);

	// Check remaining conflict elements
	const remainingConflictElements = await lix.db
		.selectFrom("change_conflict_element")
		.selectAll()
		.execute();

	expect(remainingConflictElements.length).toBe(2);
	expect(remainingConflictElements[0]?.change_conflict_id).toBe(
		mockConflict0.id,
	);
	expect(remainingConflictElements[1]?.change_conflict_id).toBe(
		mockConflict0.id,
	);

	// Check remaining branch change conflict pointers
	const remainingBranchChangeConflictPointers = await lix.db
		.selectFrom("branch_change_conflict_pointer")
		.selectAll()
		.execute();

	expect(remainingBranchChangeConflictPointers.length).toBe(1);
	expect(remainingBranchChangeConflictPointers[0]?.change_conflict_id).toBe(
		mockConflict0.id,
	);
});

test("should garbage collect conflicts that no branch conflict pointer references", async () => {
	const lix = await openLixInMemory({});

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "change0",
				plugin_key: "mock-plugin",
				schema_key: "mock",
				file_id: "mock",
				entity_id: "value0",
				snapshot_id: "no-content",
			},
			{
				id: "change1",
				plugin_key: "mock-plugin",
				schema_key: "mock",
				file_id: "mock",
				entity_id: "value1",
				snapshot_id: "no-content",
			},
		])
		.returningAll()
		.execute();

	const branch0 = await lix.db
		.insertInto("branch")
		.values([{ id: "branch0" }])
		.returningAll()
		.executeTakeFirstOrThrow();

	const mockConflict0 = await createChangeConflict({
		lix,
		branch: branch0,
		key: "mock-conflict0",
		conflictingChangeIds: new Set(["change0", "change1"]),
	});

	// current branch points to changes 0 and 1
	await lix.db
		.insertInto("branch_change_pointer")
		.values([
			{
				branch_id: branch0.id,
				change_id: changes[0]!.id,
				change_entity_id: changes[0]!.entity_id,
				change_file_id: changes[0]!.file_id,
				change_schema_key: changes[0]!.schema_key,
			},
			{
				branch_id: branch0.id,
				change_id: changes[1]!.id,
				change_entity_id: changes[1]!.entity_id,
				change_file_id: changes[1]!.file_id,
				change_schema_key: changes[1]!.schema_key,
			},
		])
		.execute();

	// delete the conflict pointers mockConflict0
	await lix.db
		.deleteFrom("branch_change_conflict_pointer")
		.where("change_conflict_id", "=", mockConflict0.id)
		.execute();

	// Run garbage collection
	const gc0 = await garbageCollectChangeConflicts({ lix });

	expect(gc0.deletedChangeConflicts.length).toBe(1);
	expect(gc0.deletedChangeConflicts.length).toBe(1);
	expect(gc0.deletedChangeConflicts[0]?.id).toBe(mockConflict0.id);
});

test("should NOT garbage collect conflicts that a branch change conflict pointer references and where each change is referenced by a branch change pointer", async () => {
	const lix = await openLixInMemory({});

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "change0",
				plugin_key: "mock-plugin",
				schema_key: "mock",
				file_id: "mock",
				entity_id: "value0",
				snapshot_id: "no-content",
			},
			{
				id: "change1",
				plugin_key: "mock-plugin",
				schema_key: "mock",
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
		branch: currentBranch,
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
				change_schema_key: changes[0]!.schema_key,
			},
			{
				branch_id: currentBranch.id,
				change_id: changes[1]!.id,
				change_entity_id: changes[1]!.entity_id,
				change_file_id: changes[1]!.file_id,
				change_schema_key: changes[1]!.schema_key,
			},
		])
		.execute();

	// Run garbage collection
	const gc0 = await garbageCollectChangeConflicts({ lix });

	expect(gc0.deletedChangeConflicts.length).toBe(0);

	// delete all branch change pointers
	await lix.db.deleteFrom("branch_change_conflict_pointer").execute();

	const gc1 = await garbageCollectChangeConflicts({ lix });
	expect(gc1.deletedChangeConflicts.length).toBe(1);
	expect(gc1.deletedChangeConflicts[0]?.id).toBe(mockConflict0.id);
});