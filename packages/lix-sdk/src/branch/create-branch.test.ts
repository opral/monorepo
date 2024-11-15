import { test, expect } from "vitest";
import { updateBranchPointers } from "../branch/update-branch-pointers.js";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createBranch } from "./create-branch.js";
import { createChangeConflict } from "../change-conflict/create-change-conflict.js";

test("it should copy the changes from the parent branch", async () => {
	const lix = await openLixInMemory({});

	const changeSet0 = await lix.db
		.insertInto("change_set")
		.defaultValues()
		.returningAll()
		.executeTakeFirstOrThrow();

	const branch0 = await lix.db
		.insertInto("branch")
		.values({ name: "branch0", change_set_id: changeSet0.id })
		.returningAll()
		.executeTakeFirstOrThrow();

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				schema_key: "file",
				entity_id: "value1",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_id: "sn1",
			},
			{
				schema_key: "file",
				entity_id: "value2",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_id: "sn2",
			},
		])
		.returningAll()
		.execute();

	await updateBranchPointers({
		lix,
		branch: branch0,
		changes,
	});

	const branch1 = await createBranch({
		lix,
		parent: branch0,
	});

	const changesInBranch0 = await lix.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change.id",
			"change_set_element.change_id",
		)
		.innerJoin(
			"branch",
			"branch.change_set_id",
			"change_set_element.change_set_id",
		)
		.selectAll("change")
		.where("branch.id", "=", branch0.id)
		.execute();

	const changesInBranch1 = await lix.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change.id",
			"change_set_element.change_id",
		)
		.innerJoin(
			"branch",
			"branch.change_set_id",
			"change_set_element.change_set_id",
		)
		.selectAll("change")
		.where("branch.id", "=", branch1.id)
		.execute();

	// main and feature branch should have the same changes
	expect(changesInBranch0).toStrictEqual(changesInBranch1);
});

// test("if a parent branch is provided, a merge target should be created to activate conflict detection", async () => {
// 	const lix = await openLixInMemory({});

// 	const branch0 = await createBranch({ lix, name: "branch0" });
// 	const branch1 = await createBranch({ lix, parent: branch0, name: "branch1" });

// 	const branchTarget = await lix.db
// 		.selectFrom("branch_target")
// 		.selectAll()
// 		.where("source_branch_id", "=", branch1.id)
// 		.where("target_branch_id", "=", branch0.id)
// 		.execute();

// 	expect(branchTarget.length).toBe(1);
// });

test("it should copy change conflict pointers from the parent branch", async () => {
	const lix = await openLixInMemory({});

	const changeSet0 = await lix.db
		.insertInto("change_set")
		.defaultValues()
		.returningAll()
		.executeTakeFirstOrThrow();

	const branch0 = await lix.db
		.insertInto("branch")
		.values({ name: "branch0", change_set_id: changeSet0.id })
		.returningAll()
		.executeTakeFirstOrThrow();

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				schema_key: "file",
				entity_id: "value1",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_id: "sn1",
			},
			{
				schema_key: "file",
				entity_id: "value2",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_id: "sn2",
			},
		])
		.returningAll()
		.execute();

	await updateBranchPointers({
		lix,
		branch: branch0,
		changes,
	});

	await createChangeConflict({
		lix,
		branch: branch0,
		key: "mock-key",
		conflictingChangeIds: new Set([changes[0]!.id, changes[1]!.id]),
	});

	const branch0Conflicts = await lix.db
		.selectFrom("branch_change_conflict_pointer")
		.where("branch_id", "=", branch0.id)
		.selectAll()
		.execute();

	expect(branch0Conflicts.length).toBe(1);

	const branch1 = await createBranch({
		lix,
		parent: branch0,
		name: "branch1",
	});

	const branch2Conflicts = await lix.db
		.selectFrom("branch_change_conflict_pointer")
		.where("branch_id", "=", branch1.id)
		.selectAll()
		.execute();

	expect(branch2Conflicts.length).toBe(1);
	expect(branch2Conflicts[0]?.change_conflict_id).toBe(
		branch0Conflicts[0]?.change_conflict_id,
	);
});
