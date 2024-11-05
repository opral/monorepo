import { test, expect, vi } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import type { LixPlugin } from "../plugin/lix-plugin.js";
import { mergeBranch } from "./merge-branch.js";

test("it should update the branch pointers for non-conflicting changes and insert detected conflicts", async () => {
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
			return [
				{
					change_id: change2!.id,
					conflicting_change_id: change3!.id,
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

	const conflicts = await lix.db.selectFrom("conflict").selectAll().execute();

	// Ensure that non-conflicting pointers (change1 and change2) are in target branch
	expect(targetPointers.map((pointer) => pointer.change_id)).toContain(
		change1?.id,
	);
	expect(targetPointers.map((pointer) => pointer.change_id)).toContain(
		change2?.id,
	);

	// Ensure that conflicting pointer (change3) is not in target branch
	expect(targetPointers.map((pointer) => pointer.change_id)).not.toContain(
		change3?.id,
	);

	// Verify that a conflict for change2 was added to the `conflict` table
	expect(conflicts.map((conflict) => conflict.change_id)).toContain(
		change2?.id,
	);
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
			// Simulate no manual conflicts; system should detect automatically
			return [];
		},
	};
	lix.plugin.getAll = vi.fn().mockResolvedValue([mockPlugin]);

	await mergeBranch({ lix, sourceBranch, targetBranch });

	// Validate results in `conflict` table
	const conflicts = await lix.db
		.selectFrom("conflict")
		.selectAll()
		.where("change_id", "=", sourceChange.id)
		.execute();

	// Ensure that the change from `sourceBranch` is detected as a conflict
	expect(conflicts).toEqual([
		expect.objectContaining({
			change_id: sourceChange.id,
			conflicting_change_id: targetChange.id,
		}),
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
