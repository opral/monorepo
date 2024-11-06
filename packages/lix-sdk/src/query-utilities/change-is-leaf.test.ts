import { test, expect } from "vitest";
import { changeIsLeaf } from "./change-is-leaf.js";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { updateBranchPointers } from "../branch/update-branch-pointers.js";
import { changeInBranch } from "./change-in-branch.js";

test("should only return the leaf change", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("change")
		.values([
			{
				id: "change1",
				snapshot_id: "empty-content",
				entity_id: "mock1",
				file_id: "mock",
				plugin_key: "mock",
				type: "mock",
			},
			{
				id: "change2",
				snapshot_id: "empty-content",
				entity_id: "mock2",
				file_id: "mock",
				plugin_key: "mock",
				type: "mock",
			},
			{
				id: "change3",
				snapshot_id: "empty-content",
				entity_id: "mock2",
				file_id: "mock",
				plugin_key: "mock",
				type: "mock",
			},
		])
		.execute();

	await lix.db
		.insertInto("change_graph_edge")
		.values([{ parent_id: "change2", child_id: "change3" }])
		.execute();

	const changes = await lix.db
		.selectFrom("change")
		.where(changeIsLeaf())
		.selectAll()
		.execute();

	expect(changes).toHaveLength(2);
	expect(changes.map((c) => c.id)).toEqual(["change1", "change3"]);
});

test("should return the change even if it's the only one", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("change")
		.values([
			{
				id: "change1",
				snapshot_id: "empty-content",
				entity_id: "mock1",
				file_id: "mock",
				plugin_key: "mock",
				type: "mock",
			},
		])
		.execute();

	const changes = await lix.db
		.selectFrom("change")
		.where(changeIsLeaf())
		.selectAll()
		.execute();

	expect(changes).toHaveLength(1);
	expect(changes.map((c) => c.id)).toEqual(["change1"]);
});

// needs sql debugging why the query is not working as expected
test.todo(
	"it should work in combination with the `changeInBranch()` filter",
	async () => {
		const lix = await openLixInMemory({});

		const changes = await lix.db
			.insertInto("change")
			.values([
				{
					id: "change1",
					snapshot_id: "empty-content",
					entity_id: "mock1",
					file_id: "mock",
					plugin_key: "mock",
					type: "mock",
				},
				{
					id: "change2",
					snapshot_id: "empty-content",
					entity_id: "mock1",
					file_id: "mock",
					plugin_key: "mock",
					type: "mock",
				},
			])
			.returningAll()
			.execute();

		await lix.db
			.insertInto("change_graph_edge")
			.values([{ parent_id: "change1", child_id: "change2" }])
			.execute();

		const currentBranch = await lix.db
			.selectFrom("current_branch")
			.selectAll()
			.executeTakeFirstOrThrow();

		// let the branch point only to the first change
		await updateBranchPointers({
			lix,
			changes: [changes[0]!],
			branch: currentBranch,
		});

		const result = await lix.db
			.selectFrom("change")
			.where(changeIsLeaf())
			.where(changeInBranch(currentBranch))
			.selectAll()
			.execute();

		// expecting the leaf change in the current branch to be change 1
		expect(result).toHaveLength(1);
		expect(result.map((c) => c.id)).toEqual(["change1"]);
	},
);



