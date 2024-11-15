import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { updateBranchPointers } from "../branch/update-branch-pointers.js";
import { changeIsLeafInBranch } from "./change-is-leaf-in-branch.js";

test("it should return the leaf change for the given branch", async () => {
	const lix = await openLixInMemory({});

	const currentBranch = await lix.db
		.selectFrom("current_branch")
		.innerJoin("branch", "current_branch.id", "branch.id")
		.selectAll("branch")
		.executeTakeFirstOrThrow();

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
		branch: currentBranch,
		// only point to the second change even though
		// the third change is a child of the second change
		changes: [insertedChanges[1]!],
	});

	const changes = await lix.db
		.selectFrom("change")
		.where(changeIsLeafInBranch(currentBranch))
		.selectAll()
		.execute();

	// change 2 is the leaf change for the current branch
	expect(changes).toHaveLength(1);
	expect(changes[0]?.id).toBe("change2");
});
