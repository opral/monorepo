import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { updateBranchPointers } from "../branch/update-branch-pointers.js";
import { changeIsLeafInBranch } from "./change-is-leaf-in-branch.js";
import { createBranch } from "../branch/create-branch.js";

test("it should return the leaf change for the given branch", async () => {
	const lix = await openLixInMemory({});

	const branch0 = await createBranch({ lix, name: "branch0" });
	const branch1 = await createBranch({ lix, name: "branch1" });

	const insertedChanges = await lix.db
		.insertInto("change")
		.values([
			{
				id: "change1",
				snapshot_id: "no-content",
				entity_id: "mock1",
				file_id: "mock",
				plugin_key: "mock",
				schema_key: "mock",
			},
			{
				id: "change2",
				snapshot_id: "no-content",
				entity_id: "mock1",
				file_id: "mock",
				plugin_key: "mock",
				schema_key: "mock",
			},
			{
				id: "change3",
				snapshot_id: "no-content",
				entity_id: "mock1",
				file_id: "mock",
				plugin_key: "mock",
				schema_key: "mock",
			},
		])
		.returningAll()
		.execute();

	await lix.db
		.insertInto("change_graph_edge")
		.values([
			// including change1 for re-assurance
			{ parent_id: "change1", child_id: "change2" },
			{ parent_id: "change2", child_id: "change3" },
		])
		.execute();

	await updateBranchPointers({
		lix,
		branch: branch0,
		// only point to the second change even though
		// the third change is a child of the second change
		changes: [insertedChanges[1]!],
	});

	// letting another branch (branch1) point to the third change
	await updateBranchPointers({
		lix,
		branch: branch1,
		changes: [insertedChanges[2]!],
	});

	const changes = await lix.db
		.selectFrom("change")
		.where(changeIsLeafInBranch(branch0))
		.selectAll()
		.execute();

	// change 2 is the leaf change for the current branch
	expect(changes).toHaveLength(1);
	expect(changes[0]?.id).toBe("change2");
});
