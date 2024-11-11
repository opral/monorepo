import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { updateBranchPointers } from "./update-branch-pointers.js";

test("the branch pointer for a change should be updated", async () => {
	const lix = await openLixInMemory({});

	const mainBranch = await lix.db
		.selectFrom("branch")
		.selectAll()
		.where("name", "=", "main")
		.executeTakeFirstOrThrow();

	await lix.db.transaction().execute(async (trx) => {
		const changes = await trx
			.insertInto("change")
			.values({
				id: "change-1",
				type: "file",
				entity_id: "value1",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			})
			.returningAll()
			.execute();

		await updateBranchPointers({
			lix: { db: trx },
			branch: mainBranch,
			changes,
		});
	});

	const branchChangePointers = await lix.db
		.selectFrom("branch_change_pointer")
		.selectAll()
		.where("branch_id", "=", mainBranch.id)
		.execute();

	// the head of the change is change-1
	expect(branchChangePointers.length).toBe(1);
	expect(branchChangePointers[0]?.change_id).toBe("change-1");

	await lix.db.transaction().execute(async (trx) => {
		const changes = await trx
			.insertInto("change")
			.values({
				id: "change-2",
				type: "file",
				entity_id: "value1",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			})
			.returningAll()
			.execute();

		await updateBranchPointers({
			lix: { db: trx },
			branch: mainBranch,
			changes,
		});
	});

	const updatedBranchChangePointers = await lix.db
		.selectFrom("branch_change_pointer")
		.selectAll()
		.where("branch_id", "=", mainBranch.id)
		.execute();

	// the head of the change is updated to change-2
	expect(updatedBranchChangePointers.length).toBe(1);
	expect(updatedBranchChangePointers[0]?.change_id).toBe("change-2");

	await lix.db.transaction().execute(async (trx) => {
		const changes = await trx
			.insertInto("change")
			.values({
				id: "change-3",
				type: "file",
				entity_id: "value2",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			})
			.returningAll()
			.execute();

		await updateBranchPointers({
			lix: { db: trx },
			branch: mainBranch,
			changes,
		});
	});

	const updatedBranchChangePointers2 = await lix.db
		.selectFrom("branch_change_pointer")
		.selectAll()
		.where("branch_id", "=", mainBranch.id)
		.execute();

	// inserting a new entity should add a new change pointer
	// while not updating the old one
	expect(updatedBranchChangePointers2.length).toBe(2);
	expect(updatedBranchChangePointers2[0]?.change_id).toBe("change-2");
	expect(updatedBranchChangePointers2[1]?.change_id).toBe("change-3");
});

test("it should default to the current branch if no branch is provided", async () => {
	const lix = await openLixInMemory({});

	const currentBranch = await lix.db
		.selectFrom("current_branch")
		.selectAll()
		.executeTakeFirstOrThrow();

	await lix.db.transaction().execute(async (trx) => {
		const changes = await trx
			.insertInto("change")
			.values({
				id: "change-1",
				type: "file",
				entity_id: "value1",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			})
			.returningAll()
			.execute();

		await updateBranchPointers({
			lix: { db: trx },
			changes,
		});
	});

	const branchChangePointers = await lix.db
		.selectFrom("branch_change_pointer")
		.selectAll()
		.where("branch_id", "=", currentBranch.id)
		.execute();

	// the head of the change is change-1
	expect(branchChangePointers.length).toBe(1);
	expect(branchChangePointers[0]?.change_id).toBe("change-1");
});

test("it should not fail if an empty array of changes is provided", async () => {
	const lix = await openLixInMemory({});

	await lix.db.transaction().execute(async (trx) => {
		await updateBranchPointers({
			lix: { db: trx },
			changes: [],
		});
	});

	const branchChangePointers = await lix.db
		.selectFrom("branch_change_pointer")
		.selectAll()
		.execute();

	// no change pointers should be created
	expect(branchChangePointers.length).toBe(0);
});

test("change conflicts should be garbage collected", async () => {
	const lix = await openLixInMemory({});

	const currentBranch = await lix.db
		.selectFrom("current_branch")
		.selectAll()
		.executeTakeFirstOrThrow();

	await lix.db.transaction().execute(async (trx) => {
		const changes = await trx
			.insertInto("change")
			.values([
				{
					id: "change-1",
					type: "file",
					entity_id: "value1",
					file_id: "mock",
					plugin_key: "mock-plugin",
					snapshot_id: "no-content",
				},
				{
					id: "change-2",
					type: "file",
					entity_id: "value2",
					file_id: "mock",
					plugin_key: "mock-plugin",
					snapshot_id: "no-content",
				},
			])
			.returningAll()
			.execute();

		await updateBranchPointers({
			lix: { db: trx },
			branch: currentBranch,
			changes,
		});
	});

	// no branch is pointing to the change conflict,
	// so it should be garbage collected

	const changeConflict = await lix.db
		.insertInto("change_conflict")
		.values({
			id: "change-conflict-1",
			key: "mock-conflict",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	await lix.db
		.insertInto("change_conflict_element")
		.values([
			{
				change_conflict_id: changeConflict.id,
				change_id: "change-1",
			},
			{
				change_conflict_id: changeConflict.id,
				change_id: "change-2",
			},
		])
		.execute();

	await updateBranchPointers({
		lix,
		branch: currentBranch,
		changes: [],
	});

	const remainingChangeConflicts = await lix.db
		.selectFrom("change_conflict")
		.selectAll()
		.execute();

	// the change conflict should be garbage collected
	expect(remainingChangeConflicts.length).toBe(0);
});