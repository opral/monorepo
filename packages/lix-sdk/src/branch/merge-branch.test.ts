import { test, expect, vi } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import type { LixPlugin } from "../plugin/lix-plugin.js";
import { mergeBranch } from "./merge-branch.js";
import type { NewChange } from "../database/schema.js";
import { updateBranchPointers } from "./update-branch-pointers.js";
import { createBranch } from "./create-branch.js";

test("it should update the branch pointers in target that are not conflicting", async () => {
	const lix = await openLixInMemory({});

	const sourceBranch = await createBranch({ lix });
	const targetBranch = await createBranch({ lix });

	const [change1] = await lix.db
		.insertInto("change")
		.values([
			{
				id: "change1",
				schema_key: "file",
				entity_id: "entity1",
				file_id: "file1",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			},
		])
		.returningAll()
		.execute();

	// source points to change1
	await updateBranchPointers({
		lix,
		branch: sourceBranch,
		changes: [change1!],
	});

	await mergeBranch({ lix, sourceBranch, targetBranch });

	const targetChanges = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", targetBranch.change_set_id)
		.selectAll()
		.execute();

	expect(targetChanges.map((c) => c.change_id)).toContain(change1?.id);
});

// edge case scenario
test("if a previously undetected conflict is detected during merge, the conflict should be inserted and the target branch change pointers updated (if the target branch does not point to the entity yet) ", async () => {
	const lix = await openLixInMemory({});

	const sourceBranch = await createBranch({ lix, name: "source-branch" });
	const targetBranch = await createBranch({ lix, name: "target-branch" });

	// Insert changes into `change` table and `branch_change_pointer` for source branch
	const [change1, change2, change3] = await lix.db
		.insertInto("change")
		.values([
			{
				id: "change1",
				schema_key: "file",
				entity_id: "entity1",
				file_id: "file1",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			},
			{
				id: "change2",
				schema_key: "file",
				entity_id: "entity2",
				file_id: "file2",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			},
			{
				id: "change3",
				schema_key: "file",
				entity_id: "entity3",
				file_id: "file3",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			},
		])
		.returningAll()
		.execute();

	await updateBranchPointers({
		lix,
		branch: sourceBranch,
		changes: [change1!, change2!, change3!],
	});

	const mockPlugin: LixPlugin = {
		key: "mock",
		detectConflictsV2: async () => {
			// simulating a conflict between change2 and change3
			// that was previously undetected
			return [
				{
					key: "mock-conflict",
					conflictingChangeIds: new Set([change2!.id, change3!.id]),
				},
			];
		},
	};

	lix.plugin.getAll = vi.fn().mockResolvedValue([mockPlugin]);

	// Execute the mergeBranch function
	await mergeBranch({ lix, sourceBranch, targetBranch });

	// Validate results in `branch_change_pointer` and `conflict` tables
	const targetChanges = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", targetBranch.change_set_id)
		.selectAll()
		.execute();

	const conflicts = await lix.db
		.selectFrom("change_conflict")
		.selectAll()
		.execute();

	const conflictElements = await lix.db
		.selectFrom("change_set_element")
		.where(
			"change_set_id",
			"in",
			conflicts.map((c) => c.change_set_id),
		)
		.selectAll()
		.execute();

	// even though change2 and change3 are conflicting, the target branch
	// should point to change2 and change3 as well given that the target
	// hasn't seen those entities yet
	expect(targetChanges.map((c) => c.change_id)).toEqual([
		change1?.id,
		change2?.id,
		change3?.id,
	]);

	expect(conflicts.map((conflict) => conflict.key)).toStrictEqual([
		"mock-conflict",
	]);

	// Verify that a conflict for change2 was added to the `conflict` table
	expect(conflictElements.map((element) => element.change_id)).toStrictEqual([
		change2?.id,
		change3?.id,
	]);
});

test("it should not update the target branch pointers of a conflicting change", async () => {
	const lix = await openLixInMemory({});

	const sourceBranch = await createBranch({ lix, name: "source-branch" });
	const targetBranch = await createBranch({ lix, name: "target-branch" });

	// Insert changes into `change` table and `branch_change_pointer` for source branch
	const [change1, change2] = await lix.db
		.insertInto("change")
		.values([
			{
				id: "change1",
				schema_key: "file",
				entity_id: "entity1",
				file_id: "file1",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			},
			{
				id: "change2",
				schema_key: "file",
				entity_id: "entity1",
				file_id: "file1",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			},
		])
		.returningAll()
		.execute();

	// source points to change1
	await updateBranchPointers({
		lix,
		branch: sourceBranch,
		changes: [change1!],
	});

	// target points to change2
	await updateBranchPointers({
		lix,
		branch: targetBranch,
		changes: [change2!],
	});

	const mockPlugin: LixPlugin = {
		key: "mock",
		detectConflictsV2: async () => {
			// simulating a conflict between change2 and change3
			// that was previously undetected
			return [
				{
					key: "mock-conflict",
					conflictingChangeIds: new Set([change1!.id, change2!.id]),
				},
			];
		},
	};

	lix.plugin.getAll = vi.fn().mockResolvedValue([mockPlugin]);

	// Execute the mergeBranch function
	await mergeBranch({ lix, sourceBranch, targetBranch });

	// Validate results in `branch_change_pointer` and `conflict` tables
	const targetChanges = await lix.db
		.selectFrom("change_set_element")
		.selectAll()
		.where("change_set_id", "=", targetBranch.change_set_id)
		.execute();

	const conflicts = await lix.db
		.selectFrom("change_conflict")
		.selectAll()
		.execute();

	const conflictElements = await lix.db
		.selectFrom("change_set_element")
		.where(
			"change_set_id",
			"in",
			conflicts.map((c) => c.change_set_id),
		)
		.selectAll()
		.execute();

	// even though change2 and change3 are conflicting, the target branch
	// should point to change2 and change3 as well given that the target
	// hasn't seen those entities yet
	expect(targetChanges.map((pointer) => pointer.change_id)).toEqual([
		// change1 should not be pointed to
		change2?.id,
	]);

	expect(conflicts.map((conflict) => conflict.key)).toStrictEqual([
		"mock-conflict",
	]);

	// Verify that a conflict for change2 was added to the `conflict` table
	expect(conflictElements.map((element) => element.change_id)).toStrictEqual([
		change1?.id,
		change2?.id,
	]);
});

// it is reasonable to assume that a conflict exists if the same (entity, file, type) change is updated in both branches.
// in case a plugin does not detect a conflict, the system should automatically detect it.
test("it should automatically detect a diverging entity conflict", async () => {
	const lix = await openLixInMemory({});

	const sourceBranch = await createBranch({ lix, name: "source-branch" });
	const targetBranch = await createBranch({ lix, name: "target-branch" });

	const ancestorChange = await lix.db
		.insertInto("change")
		.values({
			id: "ancestor-change",
			schema_key: "type1",
			entity_id: "entity1",
			file_id: "file1",
			plugin_key: "mock",
			snapshot_id: "no-content",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	// Simulate updates to the entity in both branches
	const sourceChange = await lix.db
		.insertInto("change")
		.values({
			id: "source-change",
			schema_key: "type1",
			entity_id: "entity1",
			file_id: "file1",
			plugin_key: "mock",
			snapshot_id: "no-content",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	const targetChange = await lix.db
		.insertInto("change")
		.values({
			id: "target-change",
			schema_key: "type1",
			entity_id: "entity1",
			file_id: "file1",
			plugin_key: "mock",
			snapshot_id: "no-content",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	// insert edges to ancestor change
	await lix.db
		.insertInto("change_edge")
		.values([
			{ parent_id: ancestorChange.id, child_id: sourceChange.id },
			{ parent_id: ancestorChange.id, child_id: targetChange.id },
		])
		.execute();

	await updateBranchPointers({
		lix,
		branch: sourceBranch,
		changes: [sourceChange],
	});

	await updateBranchPointers({
		lix,
		branch: targetBranch,
		changes: [targetChange],
	});

	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		detectConflictsV2: async () => {
			// Simulate no conflicts; system should detect the diverging entity conflict automatically
			return [];
		},
	};
	lix.plugin.getAll = vi.fn().mockResolvedValue([mockPlugin]);

	await mergeBranch({ lix, sourceBranch, targetBranch });

	// Validate results in `conflict` table
	const conflictElements = await lix.db
		.selectFrom("change_conflict")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_set_id",
			"change_conflict.change_set_id",
		)
		.selectAll("change_set_element")
		.execute();

	// Ensure that the change from `sourceBranch` is detected as a conflict
	expect(conflictElements.map((c) => c.change_id)).toEqual([
		sourceChange.id,
		targetChange.id,
	]);

	// ensure that the branch change pointer hasn't been updated
	const targetChanges = await lix.db
		.selectFrom("change_set_element")
		.selectAll()
		.where("change_set_id", "=", targetBranch.change_set_id)
		.execute();

	expect(targetChanges.map((pointer) => pointer.change_id)).not.toContain(
		sourceChange.id,
	);
	expect(targetChanges.map((pointer) => pointer.change_id)).toContain(
		targetChange.id,
	);
});

test("re-curring merges should not create a new conflict if the conflict already exists for the key and set of changes", async () => {
	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		applyChanges: async () => ({
			fileData: new TextEncoder().encode("mock"),
		}),
		detectConflictsV2: async () => [
			{
				key: "mock-conflict",
				conflictingChangeIds: new Set([mockChanges[0]!.id, mockChanges[1]!.id]),
			},
		],
	};

	const lix = await openLixInMemory({
		providePlugins: [mockPlugin],
	});

	const sourceBranch = await createBranch({ lix, name: "source-branch" });
	const targetBranch = await createBranch({ lix, name: "target-branch" });

	const mockChanges = [
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
			file_id: "mock",
			entity_id: "value1",
			schema_key: "mock",
			snapshot_id: "no-content",
		},
	] as const satisfies NewChange[];

	await lix.db
		.insertInto("file_internal")
		.values({ id: "mock", path: "mock", data: new Uint8Array() })
		.execute();

	const changes = await lix.db
		.insertInto("change")
		.values(mockChanges)
		.returningAll()
		.execute();

	// source branch points to change0
	await updateBranchPointers({
		lix,
		branch: sourceBranch,
		changes: [changes[0]!],
	});

	// target branch points to change1
	await updateBranchPointers({
		lix,
		branch: targetBranch,
		changes: [changes[1]!],
	});

	// First merge
	await mergeBranch({
		lix,
		sourceBranch,
		targetBranch,
	});

	// Check that no new conflict is created
	const conflictsAfter1Merge = await lix.db
		.selectFrom("change_conflict")
		.where("change_conflict.key", "=", "mock-conflict")
		.selectAll("change_conflict")
		.execute();

	expect(conflictsAfter1Merge.length).toBe(1);

	// Second merge
	await mergeBranch({
		lix,
		sourceBranch,
		targetBranch,
	});

	const conflictsAfter2Merge = await lix.db
		.selectFrom("change_conflict")
		.where("change_conflict.key", "=", "mock-conflict")
		.selectAll()
		.execute();

	expect(conflictsAfter2Merge.length).toBe(1);
});
