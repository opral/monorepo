import { describe, test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";

describe("commit_edge (derived)", () => {
	test("reflects parent_commit_ids and updates on change", async () => {
		const lix = await openLix({});

		// Create change sets and commits
		await lix.db
			.insertInto("change_set_by_version")
			.values([
				{ id: "cs0", lixcol_version_id: "global" },
				{ id: "cs1", lixcol_version_id: "global" },
			])
			.execute();

		await lix.db
			.insertInto("commit_by_version")
			.values([
				{ id: "commit0", change_set_id: "cs0", lixcol_version_id: "global" },
				{ id: "commit1", change_set_id: "cs1", lixcol_version_id: "global" },
			])
			.execute();

		// Link commit1 to commit0 via parent_commit_ids
		await lix.db
			.updateTable("commit_by_version")
			.set({ parent_commit_ids: ["commit0"] as any })
			.where("id", "=", "commit1")
			.where("lixcol_version_id", "=", "global")
			.execute();

		const viewAfterLink = await lix.db
			.selectFrom("commit_edge")
			.orderBy("parent_id", "asc")
			.where("parent_id", "=", "commit0")
			.selectAll()
			.execute();

		expect(viewAfterLink).toMatchObject([
			{ parent_id: "commit0", child_id: "commit1" },
		]);

		// Remove parent linkage
		await lix.db
			.updateTable("commit_by_version")
			.set({ parent_commit_ids: [] as any })
			.where("id", "=", "commit1")
			.where("lixcol_version_id", "=", "global")
			.execute();

		const viewAfterUnlink = await lix.db
			.selectFrom("commit_edge")
			.orderBy("parent_id", "asc")
			.where("parent_id", "=", "commit0")
			.selectAll()
			.execute();

		expect(viewAfterUnlink).toEqual([]);
	});

	test("should enforce primary key constraint (parent_id, child_id)", async () => {
		const lix = await openLix({});

		// Create the referenced change sets and commits first
		await lix.db
			.insertInto("change_set_by_version")
			.values([
				{ id: "cs0", lixcol_version_id: "global" },
				{ id: "cs1", lixcol_version_id: "global" },
			])
			.execute();

		await lix.db
			.insertInto("commit_by_version")
			.values([
				{ id: "commit0", change_set_id: "cs0", lixcol_version_id: "global" },
				{ id: "commit1", change_set_id: "cs1", lixcol_version_id: "global" },
			])
			.execute();

		// Insert first edge
		await lix.db
			.insertInto("commit_edge_by_version")
			.values({
				parent_id: "commit0",
				child_id: "commit1",
				lixcol_version_id: "global",
			})
			.execute();

		// Attempt duplicate insert with same primary key
		await expect(
			lix.db
				.insertInto("commit_edge_by_version")
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
			.insertInto("change_set_by_version")
			.values({ id: "cs1", lixcol_version_id: "global" })
			.execute();

		await lix.db
			.insertInto("commit_by_version")
			.values({
				id: "commit1",
				change_set_id: "cs1",
				lixcol_version_id: "global",
			})
			.execute();

		// Attempt to insert edge with non-existent parent_id
		await expect(
			lix.db
				.insertInto("commit_edge_by_version")
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
			.insertInto("change_set_by_version")
			.values({ id: "cs0", lixcol_version_id: "global" })
			.execute();

		await lix.db
			.insertInto("commit_by_version")
			.values({
				id: "commit0",
				change_set_id: "cs0",
				lixcol_version_id: "global",
			})
			.execute();

		// Attempt to insert edge with non-existent child_id
		await expect(
			lix.db
				.insertInto("commit_edge_by_version")
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
			.insertInto("change_set_by_version")
			.values({ id: "cs1", lixcol_version_id: "global" })
			.execute();

		await lix.db
			.insertInto("commit_by_version")
			.values({
				id: "commit1",
				change_set_id: "cs1",
				lixcol_version_id: "global",
			})
			.execute();

		// Attempt to create self-referencing edge
		await expect(
			lix.db
				.insertInto("commit_edge_by_version")
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

describe("commit", () => {
	test("allows inserting commit_by_version without pre-creating change_set", async () => {
		const lix = await openLix({});

		// Insert commit directly with a new change_set_id that doesn't exist yet
		await lix.db
			.insertInto("commit_by_version")
			.values({
				id: "commit_no_fk",
				change_set_id: "cs_no_fk",
				lixcol_version_id: "global",
			})
			.execute();

		// Verify commit exists
		const c = await lix.db
			.selectFrom("commit_by_version")
			.selectAll()
			.where("id", "=", "commit_no_fk")
			.where("lixcol_version_id", "=", "global")
			.executeTakeFirstOrThrow();

		expect(c).toMatchObject({ id: "commit_no_fk", change_set_id: "cs_no_fk" });
	});

	test("commit_by_version insertion derives change_set in cache (global)", async () => {
		const lix = await openLix({});

		await lix.db
			.insertInto("commit_by_version")
			.values({
				id: "commit_cs_only",
				change_set_id: "cs_only",
				lixcol_version_id: "global",
			})
			.execute();

		// change_set is materialized from commit snapshot into cache
		const cs = await lix.db
			.selectFrom("change_set_by_version")
			.where("id", "=", "cs_only")
			.where("lixcol_version_id", "=", "global")
			.selectAll()
			.executeTakeFirstOrThrow();

		expect(cs).toMatchObject({ id: "cs_only", lixcol_version_id: "global" });
	});

	test("commit_by_version with parent_commit_ids produces edges joined to real commit change", async () => {
		const lix = await openLix({});

		// Insert parent and child commits directly (no pre-created change_set)
		await lix.db
			.insertInto("commit_by_version")
			.values({
				id: "parentA",
				change_set_id: "csA",
				lixcol_version_id: "global",
			})
			.execute();

		await lix.db
			.insertInto("commit_by_version")
			.values({
				id: "childB",
				change_set_id: "csB",
				parent_commit_ids: ["parentA"] as any,
				lixcol_version_id: "global",
			})
			.execute();

		const row = await lix.db
			.selectFrom("commit_edge_by_version")
			.innerJoin("change", "change.id", "commit_edge_by_version.lixcol_change_id")
			.where("commit_edge_by_version.lixcol_version_id", "=", "global")
			.where("commit_edge_by_version.parent_id", "=", "parentA")
			.where("commit_edge_by_version.child_id", "=", "childB")
			.select([
				"commit_edge_by_version.parent_id as parent_id",
				"commit_edge_by_version.child_id as child_id",
				"change.entity_id as change_entity_id",
				"change.snapshot_content as snap",
			])
			.executeTakeFirstOrThrow();

		expect(row.parent_id).toBe("parentA");
		expect(row.child_id).toBe("childB");
		expect(row.change_entity_id).toBe("childB");
		expect(row.snap).toMatchObject({
			id: "childB",
			change_set_id: "csB",
			parent_commit_ids: ["parentA"],
		});
	});
});
