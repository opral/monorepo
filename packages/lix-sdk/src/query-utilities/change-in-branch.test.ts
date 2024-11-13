import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { changeInBranch } from "./change-in-branch.js";

test("selectChangeInBranch should retrieve all changes in the branch including ancestors", async () => {
	const lix = await openLixInMemory({});

	const branch = await lix.db
		.insertInto("branch")
		.values({ name: "test-branch" })
		.returningAll()
		.executeTakeFirstOrThrow();

	// Insert changes and create a parent-child chain in change_graph_edge
	const [, , changeC] = await lix.db
		.insertInto("change")
		.values([
			{
				id: "changeA",
				entity_id: "entity1",
				schema_key: "type1",
				file_id: "file1",
				plugin_key: "plugin1",
				snapshot_id: "no-content",
			},
			{
				id: "changeB",
				entity_id: "entity1",
				schema_key: "type1",
				file_id: "file1",
				plugin_key: "plugin1",
				snapshot_id: "no-content",
			},
			{
				id: "changeC",
				entity_id: "entity1",
				schema_key: "type1",
				file_id: "file1",
				plugin_key: "plugin1",
				snapshot_id: "no-content",
			},
			{
				id: "changeD",
				entity_id: "entity1",
				schema_key: "type1",
				file_id: "file1",
				plugin_key: "plugin1",
				snapshot_id: "no-content",
			},
		])
		.returningAll()
		.execute();

	// Link changes in change_graph_edge (C <- B <- A)
	await lix.db
		.insertInto("change_graph_edge")
		.values([
			{ parent_id: "changeA", child_id: "changeB" },
			{ parent_id: "changeB", child_id: "changeC" },
		])
		.execute();

	// Point the branch to changeC, which should include changeA and changeB as ancestors
	await lix.db
		.insertInto("branch_change_pointer")
		.values({
			branch_id: branch.id,
			change_id: "changeC",
			change_file_id: changeC!.file_id,
			change_entity_id: changeC!.entity_id,
			change_type: changeC!.schema_key,
		})
		.execute();

	const changes = await lix.db
		.selectFrom("change")
		.where(changeInBranch(branch))
		.selectAll()
		.execute();

	// Verify the returned changes include changeC and its ancestors changeA and changeB
	const changeIds = changes.map((change) => change.id);

	// change D is not pointed at in th branch, so it should not be included
	expect(changes).toHaveLength(3);
	expect(changeIds).toContain("changeA");
	expect(changeIds).toContain("changeB");
	expect(changeIds).toContain("changeC");
});
