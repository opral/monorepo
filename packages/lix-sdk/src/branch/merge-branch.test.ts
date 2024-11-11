import { test, expect, vi } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import type { LixPlugin } from "../plugin/lix-plugin.js";
import { mergeBranch } from "./merge-branch.js";
import type { NewChange } from "../database/schema.js";
import { updateBranchPointers } from "./update-branch-pointers.js";

test("it should update the branch pointers in target that are not conflicting", async () => {
	const lix = await openLixInMemory({});

	// Initialize source and target branches
	const sourceBranch = await lix.db
		.insertInto("branch")
		.values({ name: "source-branch" })
		.returningAll()
		.executeTakeFirstOrThrow();

	const targetBranch = await lix.db
		.insertInto("branch")
		.values({ name: "target-branch" })
		.returningAll()
		.executeTakeFirstOrThrow();

	// Insert changes into `change` table and `branch_change_pointer` for source branch
	const [change1] = await lix.db
		.insertInto("change")
		.values([
			{
				id: "change1",
				type: "file",
				entity_id: "entity1",
				file_id: "file1",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			},
		])
		.returningAll()
		.execute();

	await lix.db
		.insertInto("branch_change_pointer")
		.values([
			// only source points to change1
			{
				branch_id: sourceBranch.id,
				change_id: change1!.id,
				change_entity_id: change1!.entity_id,
				change_file_id: change1!.file_id,
				change_type: change1!.type,
			},
		])
		.execute();

	// Execute the mergeBranch function
	await mergeBranch({ lix, sourceBranch, targetBranch });

	// Validate results in `branch_change_pointer` and `conflict` tables
	const targetPointers = await lix.db
		.selectFrom("branch_change_pointer")
		.selectAll()
		.where("branch_id", "=", targetBranch.id)
		.execute();

	expect(targetPointers.map((pointer) => pointer.change_id)).toContain(
		change1?.id,
	);
});

// edge case scenario
test("if a previously undetected conflict is detected during merge, the conflict should be inserted and the target branch change pointers updated (if the target branch does not point to the entity yet) ", async () => {
	const lix = await openLixInMemory({});

	// Initialize source and target branches
	const sourceBranch = await lix.db
		.insertInto("branch")
		.values({ name: "source-branch" })
		.returningAll()
		.executeTakeFirstOrThrow();

	const targetBranch = await lix.db
		.insertInto("branch")
		.values({ name: "target-branch" })
		.returningAll()
		.executeTakeFirstOrThrow();

	// Insert changes into `change` table and `branch_change_pointer` for source branch
	const [change1, change2, change3] = await lix.db
		.insertInto("change")
		.values([
			{
				id: "change1",
				type: "file",
				entity_id: "entity1",
				file_id: "file1",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			},
			{
				id: "change2",
				type: "file",
				entity_id: "entity2",
				file_id: "file2",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			},
			{
				id: "change3",
				type: "file",
				entity_id: "entity3",
				file_id: "file3",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			},
		])
		.returningAll()
		.execute();

	await lix.db
		.insertInto("branch_change_pointer")
		.values([
			{
				branch_id: sourceBranch.id,
				change_id: change1!.id,
				change_entity_id: change1!.entity_id,
				change_file_id: change1!.file_id,
				change_type: change1!.type,
			},
			{
				branch_id: sourceBranch.id,
				change_id: change2!.id,
				change_entity_id: change2!.entity_id,
				change_file_id: change2!.file_id,
				change_type: change2!.type,
			},
			{
				branch_id: sourceBranch.id,
				change_id: change3!.id,
				change_entity_id: change3!.entity_id,
				change_file_id: change3!.file_id,
				change_type: change3!.type,
			},
		])
		.execute();

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
	const targetPointers = await lix.db
		.selectFrom("branch_change_pointer")
		.selectAll()
		.where("branch_id", "=", targetBranch.id)
		.execute();

	const conflicts = await lix.db
		.selectFrom("change_conflict")
		.selectAll()
		.execute();

	const conflictEdges = await lix.db
		.selectFrom("change_conflict_element")
		.selectAll()
		.execute();

	// even though change2 and change3 are conflicting, the target branch
	// should point to change2 and change3 as well given that the target
	// hasn't seen those entities yet
	expect(targetPointers.map((pointer) => pointer.change_id)).toEqual([
		change1?.id,
		change2?.id,
		change3?.id,
	]);

	expect(conflicts.map((conflict) => conflict.key)).toStrictEqual([
		"mock-conflict",
	]);

	// Verify that a conflict for change2 was added to the `conflict` table
	expect(conflictEdges.map((edge) => edge.change_id)).toStrictEqual([
		change2?.id,
		change3?.id,
	]);
});

test("it should not update the target branch pointers of a conflicting change", async () => {
	const lix = await openLixInMemory({});

	// Initialize source and target branches
	const sourceBranch = await lix.db
		.insertInto("branch")
		.values({ name: "source-branch" })
		.returningAll()
		.executeTakeFirstOrThrow();

	const targetBranch = await lix.db
		.insertInto("branch")
		.values({ name: "target-branch" })
		.returningAll()
		.executeTakeFirstOrThrow();

	// Insert changes into `change` table and `branch_change_pointer` for source branch
	const [change1, change2] = await lix.db
		.insertInto("change")
		.values([
			{
				id: "change1",
				type: "file",
				entity_id: "entity1",
				file_id: "file1",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			},
			{
				id: "change2",
				type: "file",
				entity_id: "entity1",
				file_id: "file1",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			},
		])
		.returningAll()
		.execute();

	await lix.db
		.insertInto("branch_change_pointer")
		.values([
			// source points to change1
			{
				branch_id: sourceBranch.id,
				change_id: change1!.id,
				change_entity_id: change1!.entity_id,
				change_file_id: change1!.file_id,
				change_type: change1!.type,
			},
			// target points to change2
			{
				branch_id: targetBranch.id,
				change_id: change2!.id,
				change_entity_id: change2!.entity_id,
				change_file_id: change2!.file_id,
				change_type: change2!.type,
			},
		])
		.execute();

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
	const targetPointers = await lix.db
		.selectFrom("branch_change_pointer")
		.selectAll()
		.where("branch_id", "=", targetBranch.id)
		.execute();

	const conflicts = await lix.db
		.selectFrom("change_conflict")
		.selectAll()
		.execute();

	const conflictEdges = await lix.db
		.selectFrom("change_conflict_element")
		.selectAll()
		.execute();

	// even though change2 and change3 are conflicting, the target branch
	// should point to change2 and change3 as well given that the target
	// hasn't seen those entities yet
	expect(targetPointers.map((pointer) => pointer.change_id)).toEqual([
		// change1 should not be pointed to
		change2?.id,
	]);

	expect(conflicts.map((conflict) => conflict.key)).toStrictEqual([
		"mock-conflict",
	]);

	// Verify that a conflict for change2 was added to the `conflict` table
	expect(conflictEdges.map((edge) => edge.change_id)).toStrictEqual([
		change1?.id,
		change2?.id,
	]);
});

// it is reasonable to assume that a conflict exists if the same (entity, file, type) change is updated in both branches.
// in case a plugin does not detect a conflict, the system should automatically detect it.
test("it should automatically detect a conflict if a change exists that differs updates in both branches despite having a common ancestor", async () => {
	const lix = await openLixInMemory({});

	// Initialize source and target branches
	const sourceBranch = await lix.db
		.insertInto("branch")
		.values({ name: "source-branch" })
		.returningAll()
		.executeTakeFirstOrThrow();

	const targetBranch = await lix.db
		.insertInto("branch")
		.values({ name: "target-branch" })
		.returningAll()
		.executeTakeFirstOrThrow();

	const ancestorChange = await lix.db
		.insertInto("change")
		.values({
			id: "ancestor-change",
			type: "type1",
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
			type: "type1",
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
			type: "type1",
			entity_id: "entity1",
			file_id: "file1",
			plugin_key: "mock",
			snapshot_id: "no-content",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	// insert edges to ancestor change
	await lix.db
		.insertInto("change_graph_edge")
		.values([
			{ parent_id: ancestorChange.id, child_id: sourceChange.id },
			{ parent_id: ancestorChange.id, child_id: targetChange.id },
		])
		.execute();

	// Insert head pointers for source and target branches
	await lix.db
		.insertInto("branch_change_pointer")
		.values([
			{
				branch_id: sourceBranch.id,
				change_id: sourceChange.id,
				change_entity_id: "entity1",
				change_file_id: "file1",
				change_type: "type1",
			},
			{
				branch_id: targetBranch.id,
				change_id: targetChange.id,
				change_entity_id: "entity1",
				change_file_id: "file1",
				change_type: "type1",
			},
		])
		.execute();

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
	const conflictEdges = await lix.db
		.selectFrom("change_conflict_element")
		.selectAll()
		.execute();

	// Ensure that the change from `sourceBranch` is detected as a conflict
	expect(conflictEdges.map((c) => c.change_id)).toEqual([
		sourceChange.id,
		targetChange.id,
	]);

	// ensure that the branch change pointer hasn't been updated
	const targetPointers = await lix.db
		.selectFrom("branch_change_pointer")
		.selectAll()
		.where("branch_id", "=", targetBranch.id)
		.execute();

	expect(targetPointers.map((pointer) => pointer.change_id)).not.toContain(
		sourceChange.id,
	);
	expect(targetPointers.map((pointer) => pointer.change_id)).toContain(
		targetChange.id,
	);
});

test("re-curring merges should not create a new conflict if the conflict already exists for the key and set of changes", async () => {
	const mockChanges = [
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
			file_id: "mock",
			entity_id: "value1",
			type: "mock",
			snapshot_id: "no-content",
		},
	] as const satisfies NewChange[];

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

	await lix.db
		.insertInto("file_internal")
		.values({ id: "mock", path: "mock", data: new Uint8Array() })
		.execute();

	const changes = await lix.db
		.insertInto("change")
		.values(mockChanges)
		.returningAll()
		.execute();

	const sourceBranch = await lix.db
		.insertInto("branch")
		.values({ id: "source-branch" })
		.returningAll()
		.executeTakeFirstOrThrow();

	const targetBranch = await lix.db
		.insertInto("branch")
		.values({ id: "target-branch" })
		.returningAll()
		.executeTakeFirstOrThrow();

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


test("it should create a merge intent between the source and target branch if not existent yet to recurringly detect and update conflicts", async () => {
	const lix = await openLixInMemory({});

	const sourceBranch = await lix.db
		.insertInto("branch")
		.values({ name: "source-branch" })
		.returningAll()
		.executeTakeFirstOrThrow();

	const targetBranch = await lix.db
		.insertInto("branch")
		.values({ name: "target-branch" })
		.returningAll()
		.executeTakeFirstOrThrow();

	await mergeBranch({ lix, sourceBranch, targetBranch });

	const mergeIntent = await lix.db
		.selectFrom("branch_merge_intent")
		.selectAll()
		.execute();

	expect(mergeIntent.length).toBe(1);
	expect(mergeIntent[0]?.source_branch_id).toBe(sourceBranch.id);
	expect(mergeIntent[0]?.target_branch_id).toBe(targetBranch.id);
});