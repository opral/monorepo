import { describe, test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";

describe("commit_edge", () => {
	test("insert, delete on the commit edge view", async () => {
		const lix = await openLix({});

		// Create the referenced commits first
		// Need to create change sets and then commits
		await lix.db
			.insertInto("change_set_all")
			.values([
				{ id: "cs0", lixcol_version_id: "global" },
				{ id: "cs1", lixcol_version_id: "global" },
			])
			.execute();

		await lix.db
			.insertInto("commit_all")
			.values([
				{ id: "commit0", change_set_id: "cs0", lixcol_version_id: "global" },
				{ id: "commit1", change_set_id: "cs1", lixcol_version_id: "global" },
			])
			.execute();

		await lix.db
			.insertInto("commit_edge_all")
			.values([
				{
					parent_id: "commit0",
					child_id: "commit1",
					lixcol_version_id: "global",
				},
			])
			.execute();

		const viewAfterInsert = await lix.db
			.selectFrom("commit_edge")
			.orderBy("parent_id", "asc")
			.where("parent_id", "=", "commit0")
			.selectAll()
			.execute();

		expect(viewAfterInsert).toMatchObject([
			{
				parent_id: "commit0",
				child_id: "commit1",
			},
		]);

		await lix.db
			.deleteFrom("commit_edge")
			.where("parent_id", "=", "commit0")
			.execute();

		const viewAfterDelete = await lix.db
			.selectFrom("commit_edge")
			.orderBy("parent_id", "asc")
			.where("parent_id", "=", "commit0")
			.selectAll()
			.execute();

		expect(viewAfterDelete).toEqual([]);
	});

	test("should enforce primary key constraint (parent_id, child_id)", async () => {
		const lix = await openLix({});

		// Create the referenced change sets and commits first
		await lix.db
			.insertInto("change_set_all")
			.values([
				{ id: "cs0", lixcol_version_id: "global" },
				{ id: "cs1", lixcol_version_id: "global" },
			])
			.execute();

		await lix.db
			.insertInto("commit_all")
			.values([
				{ id: "commit0", change_set_id: "cs0", lixcol_version_id: "global" },
				{ id: "commit1", change_set_id: "cs1", lixcol_version_id: "global" },
			])
			.execute();

		// Insert first edge
		await lix.db
			.insertInto("commit_edge_all")
			.values({
				parent_id: "commit0",
				child_id: "commit1",
				lixcol_version_id: "global",
			})
			.execute();

		// Attempt duplicate insert with same primary key
		await expect(
			lix.db
				.insertInto("commit_edge_all")
				.values({
					parent_id: "commit0",
					child_id: "commit1",
					lixcol_version_id: "global",
				})
				.execute()
		).rejects.toThrow(/Primary key constraint violation/i);
	});

	test("should enforce foreign key constraint on parent_id", async () => {
		const lix = await openLix({});

		// Create only child commit (not parent)
		await lix.db
			.insertInto("change_set_all")
			.values({ id: "cs1", lixcol_version_id: "global" })
			.execute();

		await lix.db
			.insertInto("commit_all")
			.values({
				id: "commit1",
				change_set_id: "cs1",
				lixcol_version_id: "global",
			})
			.execute();

		// Attempt to insert edge with non-existent parent_id
		await expect(
			lix.db
				.insertInto("commit_edge_all")
				.values({
					parent_id: "commit_nonexistent",
					child_id: "commit1",
					lixcol_version_id: "global",
				})
				.execute()
		).rejects.toThrow(/Foreign key constraint violation/i);
	});

	test("should enforce foreign key constraint on child_id", async () => {
		const lix = await openLix({});

		// Create only parent commit (not child)
		await lix.db
			.insertInto("change_set_all")
			.values({ id: "cs0", lixcol_version_id: "global" })
			.execute();

		await lix.db
			.insertInto("commit_all")
			.values({
				id: "commit0",
				change_set_id: "cs0",
				lixcol_version_id: "global",
			})
			.execute();

		// Attempt to insert edge with non-existent child_id
		await expect(
			lix.db
				.insertInto("commit_edge_all")
				.values({
					parent_id: "commit0",
					child_id: "commit_nonexistent",
					lixcol_version_id: "global",
				})
				.execute()
		).rejects.toThrow(/Foreign key constraint violation/i);
	});

	test("should prevent self-referencing edges", async () => {
		const lix = await openLix({});

		// Create a commit
		await lix.db
			.insertInto("change_set_all")
			.values({ id: "cs1", lixcol_version_id: "global" })
			.execute();

		await lix.db
			.insertInto("commit_all")
			.values({
				id: "commit1",
				change_set_id: "cs1",
				lixcol_version_id: "global",
			})
			.execute();

		// Attempt to create self-referencing edge
		await expect(
			lix.db
				.insertInto("commit_edge_all")
				.values({
					parent_id: "commit1",
					child_id: "commit1", // Same as parent_id
					lixcol_version_id: "global",
				})
				.execute()
		).rejects.toThrow(/Self-referencing edges are not allowed/i);
	});

	// the composite primary key (parent_id, child_id) is mutated
	// thus, a new edge is created while the old one is kept
	// in a later iteration we can handle updates of compound primary keys
	test.skip("commit_edge view supports updates", async () => {
		const lix = await openLix({});

		// Create change sets and commits
		await lix.db
			.insertInto("change_set")
			.values([{ id: "cs0" }, { id: "cs1" }, { id: "cs2" }])
			.execute();

		await lix.db
			.insertInto("commit")
			.values([
				{ id: "commit0", change_set_id: "cs0" },
				{ id: "commit1", change_set_id: "cs1" },
				{ id: "commit2", change_set_id: "cs2" },
			])
			.execute();

		// Insert an edge
		await lix.db
			.insertInto("commit_edge")
			.values({
				parent_id: "commit0",
				child_id: "commit1",
			})
			.execute();

		// Update should succeed
		const result = await lix.db
			.updateTable("commit_edge")
			.where("parent_id", "=", "commit0")
			.set({ child_id: "commit2" })
			.execute();

		expect(result).toBeDefined();

		// Verify the update
		const updatedEdge = await lix.db
			.selectFrom("commit_edge")
			// .where("parent_id", "=", "commit0")
			// .where("lixcol_version_id", "=", "global")
			.select(["parent_id", "child_id"])
			.orderBy("parent_id", "asc")
			.execute();

		expect(updatedEdge).toMatchObject([
			{
				parent_id: "commit0",
				child_id: "commit2",
			},
		]);
	});
});
