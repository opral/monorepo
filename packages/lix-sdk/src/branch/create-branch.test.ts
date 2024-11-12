import { test, expect } from "vitest";
import { updateBranchPointers } from "../branch/update-branch-pointers.js";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createBranch } from "./create-branch.js";

test("it should copy the change pointers from the parent branch", async () => {
	const lix = await openLixInMemory({});

	const mainBranch = await lix.db
		.selectFrom("branch")
		.selectAll()
		.where("name", "=", "main")
		.executeTakeFirstOrThrow();

	await lix.db.transaction().execute(async (trx) => {
		const changes = await trx
			.insertInto("change")
			.values([
				{
					type: "file",
					entity_id: "value1",
					file_id: "mock",
					plugin_key: "mock-plugin",
					snapshot_id: "sn1",
				},
				{
					type: "file",
					entity_id: "value2",
					file_id: "mock",
					plugin_key: "mock-plugin",
					snapshot_id: "sn2",
				},
			])
			.returningAll()
			.execute();

		await updateBranchPointers({
			lix: { ...lix, db: trx },
			branch: mainBranch,
			changes,
		});
	});

	const branch = await createBranch({
		lix,
		parent: mainBranch,
		name: "feature-branch",
	});

	const branchChangePointers = await lix.db
		.selectFrom("branch_change_pointer")
		.selectAll()
		.execute();

	// main and feature branch should have the same change pointers
	expect(branchChangePointers.length).toBe(4);
	expect(branchChangePointers.map((pointer) => pointer.branch_id)).toEqual([
		mainBranch.id,
		mainBranch.id,
		branch.id,
		branch.id,
	]);
});

test("if a parent branch is provided, a merge target should be created to activate conflict detection", async () => {
	const lix = await openLixInMemory({});

	const branch0 = await createBranch({ lix, name: "branch0" });
	const branch1 = await createBranch({ lix, parent: branch0, name: "branch1" });

	const branchTarget = await lix.db
		.selectFrom("branch_target")
		.selectAll()
		.where("source_branch_id", "=", branch1.id)
		.where("target_branch_id", "=", branch0.id)
		.execute();

	expect(branchTarget.length).toBe(1);
});