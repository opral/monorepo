import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { updateBranchPointers } from "./update-branch-pointers.js";
import type { Change } from "../database/schema.js";

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
				schema_key: "file",
				entity_id: "value1",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			})
			.returningAll()
			.execute();

		await updateBranchPointers({
			lix: { ...lix, db: trx },
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
				schema_key: "file",
				entity_id: "value1",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			})
			.returningAll()
			.execute();

		await updateBranchPointers({
			lix: { ...lix, db: trx },
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
				schema_key: "file",
				entity_id: "value2",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			})
			.returningAll()
			.execute();

		await updateBranchPointers({
			lix: { ...lix, db: trx },
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
				schema_key: "file",
				entity_id: "value1",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			})
			.returningAll()
			.execute();

		await updateBranchPointers({
			lix: { ...lix, db: trx },
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
			lix: { ...lix, db: trx },
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

// uncertain if behavior generalizes. might be better to have this as an opt-in automation.
test.skip("change conflicts should be garbage collected", async () => {
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
					schema_key: "file",
					entity_id: "value1",
					file_id: "mock",
					plugin_key: "mock-plugin",
					snapshot_id: "no-content",
				},
				{
					id: "change-2",
					schema_key: "file",
					entity_id: "value2",
					file_id: "mock",
					plugin_key: "mock-plugin",
					snapshot_id: "no-content",
				},
			])
			.returningAll()
			.execute();

		await updateBranchPointers({
			lix: { ...lix, db: trx },
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

// uncertain if behavior generalizes. might be better to have this as an opt-in automation.
test.skip("it raise a diverging entity conflict (based off a reproduction)", async () => {
	const lix = await openLixInMemory({});

	const sourceBranch = await lix.db
		.insertInto("branch")
		.values({ name: "moles-burn" })
		.returningAll()
		.executeTakeFirstOrThrow();

	const targetBranch = await lix.db
		.insertInto("branch")
		.values({ name: "elephant" })
		.returningAll()
		.executeTakeFirstOrThrow();

	const mockChanges = [
		{
			created_at: "2024-11-11 21:16:34",
			entity_id: "email|peter.n@moon.mail|First name",
			file_id: "oj20a1-40ss-email",
			id: "b2bc8cb4-8491-4e3b-ba9e-2950f5ec4942",
			plugin_key: "lix-plugin-csv-v2",
			snapshot_id:
				"c1c691266638c585ddf68c90c9255741b55cc6c152919368b27d74fbc6abc402",
			schema_key: "cell",
		},
		{
			created_at: "2024-11-11 21:16:39",
			entity_id: "email|peter.n@moon.mail|First name",
			file_id: "oj20a1-40ss-email",
			id: "654d91f1-6139-434c-9047-9fff751ed0c4",
			plugin_key: "lix-plugin-csv-v2",
			snapshot_id:
				"0856f597848e8261147613b673b27b11b7d6065d8a37cef0466fa7c4444db286",
			schema_key: "cell",
		},
		{
			created_at: "2024-11-11 21:16:44",
			entity_id: "email|peter.n@moon.mail|First name",
			file_id: "oj20a1-40ss-email",
			id: "a4b48412-f809-49c9-83ce-77fe51831961",
			plugin_key: "lix-plugin-csv-v2",
			snapshot_id:
				"078a7602380806c1cca81547dc9442c550e9d5051da3b68c495b776fc85fefcb",
			schema_key: "cell",
		},
		{
			created_at: "2024-11-11 21:17:39",
			entity_id: "email|peter.n@moon.mail|First name",
			file_id: "oj20a1-40ss-email",
			id: "4e9fd25f-ed9c-40ae-a2ad-1a75677a2668",
			plugin_key: "lix-plugin-csv-v2",
			snapshot_id:
				"bf8b0881a7c85e6e16819a87e9124362b29926a30c04bd3149f5090535c671f0",
			schema_key: "cell",
		},
	] as const satisfies Change[];

	const edges = [
		// common ancestor is b2bc
		{
			parent_id: "b2bc8cb4-8491-4e3b-ba9e-2950f5ec4942",
			child_id: "654d91f1-6139-434c-9047-9fff751ed0c4",
		},
		{
			parent_id: "b2bc8cb4-8491-4e3b-ba9e-2950f5ec4942",
			child_id: "a4b48412-f809-49c9-83ce-77fe51831961",
		},
		{
			child_id: "4e9fd25f-ed9c-40ae-a2ad-1a75677a2668",
			parent_id: "654d91f1-6139-434c-9047-9fff751ed0c4",
		},
	];

	await lix.db.insertInto("change").values(mockChanges).execute();

	await lix.db.insertInto("change_graph_edge").values(edges).execute();

	await updateBranchPointers({
		lix,
		branch: sourceBranch,
		changes: [
			mockChanges.find(
				(change) => change.id === "a4b48412-f809-49c9-83ce-77fe51831961",
			)!,
		],
	});

	await updateBranchPointers({
		lix,
		branch: targetBranch,
		changes: [
			mockChanges.find(
				(change) => change.id === "654d91f1-6139-434c-9047-9fff751ed0c4",
			)!,
		],
	});

	// await lix.db
	// 	.insertInto("branch_target")
	// 	.values({
	// 		source_branch_id: sourceBranch.id,
	// 		target_branch_id: targetBranch.id,
	// 	})
	// 	.execute();

	await updateBranchPointers({
		lix,
		branch: targetBranch,
		changes: [
			mockChanges.find(
				(change) => change.id === "4e9fd25f-ed9c-40ae-a2ad-1a75677a2668",
			)!,
		],
	});

	await lix.settled();

	const conflicts = await lix.db
		.selectFrom("change_conflict")
		.selectAll()
		.execute();

	const conflictElements = await lix.db
		.selectFrom("change_conflict_element")
		.selectAll()
		.execute();

	expect(conflicts.length).toBe(1);
	expect(conflictElements.length).toBe(2);
});
