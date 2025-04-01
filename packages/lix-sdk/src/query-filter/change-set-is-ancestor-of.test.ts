import { test, expect } from "vitest";
import { changeSetIsAncestorOf } from "./change-set-is-ancestor-of.js";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import type { ChangeSet } from "../change-set/database-schema.js";

test("changeSetIsAncestorOf filter selects changes from specified change set and ancestors", async () => {
	const lix = await openLixInMemory({});

	// Create change sets
	const changeSets = [
		{ id: "change-set-1" },
		{ id: "change-set-2" },
		{ id: "change-set-3" },
	] satisfies Partial<ChangeSet>[];

	await lix.db.insertInto("change_set").values(changeSets).execute();

	// Create change set relationships (parent -> child)
	await lix.db
		.insertInto("change_set_edge")
		.values([
			{ parent_id: "change-set-1", child_id: "change-set-2" },
			{ parent_id: "change-set-2", child_id: "change-set-3" },
		])
		.execute();

	// Create snapshots
	const snapshot1 = await lix.db
		.insertInto("snapshot")
		.values({ content: { value: "content1" } })
		.returning("id")
		.executeTakeFirstOrThrow();

	const snapshot2 = await lix.db
		.insertInto("snapshot")
		.values({ content: { value: "content2" } })
		.returning("id")
		.executeTakeFirstOrThrow();

	const snapshot3 = await lix.db
		.insertInto("snapshot")
		.values({ content: { value: "content3" } })
		.returning("id")
		.executeTakeFirstOrThrow();

	// Create changes
	const change1 = await lix.db
		.insertInto("change")
		.values({
			entity_id: "entity-1",
			file_id: "file-1",
			plugin_key: "test",
			schema_key: "test",
			snapshot_id: snapshot1.id,
			created_at: "2023-01-01T01:00:00Z",
		})
		.returning("id")
		.executeTakeFirstOrThrow();

	const change2 = await lix.db
		.insertInto("change")
		.values({
			entity_id: "entity-1",
			file_id: "file-1",
			plugin_key: "test",
			schema_key: "test",
			snapshot_id: snapshot2.id,
			created_at: "2023-01-02T01:00:00Z",
		})
		.returning("id")
		.executeTakeFirstOrThrow();

	const change3 = await lix.db
		.insertInto("change")
		.values({
			entity_id: "entity-2",
			file_id: "file-1",
			plugin_key: "test",
			schema_key: "test",
			snapshot_id: snapshot3.id,
			created_at: "2023-01-03T01:00:00Z",
		})
		.returning("id")
		.executeTakeFirstOrThrow();

	// Associate changes with change sets
	await lix.db
		.insertInto("change_set_element")
		.values([
			{
				change_id: change1.id,
				change_set_id: "change-set-1",
				entity_id: "entity-1",
				schema_key: "test",
				file_id: "file-1",
			},
			{
				change_id: change2.id,
				change_set_id: "change-set-2",
				entity_id: "entity-1",
				schema_key: "test",
				file_id: "file-1",
			},
			{
				change_id: change3.id,
				change_set_id: "change-set-3",
				entity_id: "entity-2",
				schema_key: "test",
				file_id: "file-1",
			},
		])
		.execute();

	// Test 1: direct mode selects only changes from the specified change set
	const direct = await lix.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_id",
			"change.id"
		)
		.where(changeSetIsAncestorOf({ id: "change-set-2" }, { type: "direct" }))
		.selectAll("change")
		.execute();

	expect(direct).toHaveLength(1);
	expect(direct[0]?.id).toBe(change2.id);

	// Test 2: recursive mode with no depth limit selects changes from the specified change set and all ancestors
	const recursive = await lix.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_id",
			"change.id"
		)
		.where(changeSetIsAncestorOf({ id: "change-set-3" }, { type: "recursive" }))
		.selectAll("change")
		.execute();

	expect(recursive).toHaveLength(3);
	expect(recursive.map((c) => c.id).sort()).toEqual(
		[change1.id, change2.id, change3.id].sort()
	);

	// Test 3: recursive mode with depth=1 limits ancestry traversal to immediate parents
	const limitedDepth = await lix.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_id",
			"change.id"
		)
		.where(
			changeSetIsAncestorOf(
				{ id: "change-set-3" },
				{ type: "recursive", depth: 1 }
			)
		)
		.selectAll("change")
		.execute();

	expect(limitedDepth).toHaveLength(2);
	expect(limitedDepth.map((c) => c.id).sort()).toEqual(
		[change2.id, change3.id].sort()
	);
});
