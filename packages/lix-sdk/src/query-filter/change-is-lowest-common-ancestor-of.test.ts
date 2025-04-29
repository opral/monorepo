// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { changeIsLowestCommonAncestorOf } from "./change-is-lowest-common-ancestor-of.js";
import type { NewChange, NewChangeEdge } from "../database/schema.js";

test.skip("it find the lowest common ancestor", async () => {
	const lix = await openLixInMemory({});

	const mockChanges = [
		{
			id: "0",
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock",
			schema_key: "mock",
			created_at: "mock",
			snapshot_id: "no-content",
		},
		{
			id: "1",
			file_id: "mock",
			entity_id: "value1",
			plugin_key: "mock",
			schema_key: "mock",
			created_at: "mock",
			snapshot_id: "no-content",
		},
		{
			id: "2",
			file_id: "mock",
			entity_id: "value1",
			plugin_key: "mock",
			schema_key: "mock",
			created_at: "mock",
			snapshot_id: "no-content",
		},
		{
			id: "3",
			file_id: "mock",
			entity_id: "value1",
			plugin_key: "mock",
			schema_key: "mock",
			created_at: "mock",
			snapshot_id: "no-content",
		},
		{
			id: "common",
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock",
			schema_key: "mock",
			created_at: "mock",
			snapshot_id: "no-content",
		},
		{
			id: "lowest-common",
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock",
			schema_key: "mock",
			created_at: "mock",
			snapshot_id: "no-content",
		},
	] as const satisfies NewChange[];

	const edges = [
		{ parent_id: "common", child_id: "lowest-common" },
		{ parent_id: "lowest-common", child_id: "0" },
		{ parent_id: "lowest-common", child_id: "1" },
		{ parent_id: "0", child_id: "2" },
		{ parent_id: "1", child_id: "3" },
	] satisfies NewChangeEdge[];

	await lix.db.insertInto("change").values(mockChanges).execute();
	await lix.db.insertInto("change_edge").values(edges).execute();

	// expect(commonAncestors).toHaveLength(2);
	// expect(commonAncestors.map((a) => a.id)).toEqual(
	// 	expect.arrayContaining(["lowest-common", "common"]),
	// );

	const lowestCommonAncestor = await lix.db
		.selectFrom("change")
		.where(changeIsLowestCommonAncestorOf([mockChanges[2], mockChanges[3]]))
		.selectAll()
		.executeTakeFirst();

	expect(lowestCommonAncestor?.id).toBe("lowest-common");
});

test.skip("it should return no results if no common parent exists", async () => {
	const lix = await openLixInMemory({});

	const mockChanges = [
		{
			id: "0",
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock",
			schema_key: "mock",
			snapshot_id: "no-content",
		},
		{
			id: "1",
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock",
			schema_key: "mock",
			snapshot_id: "no-content",
		},
		{
			id: "2",
			entity_id: "value2",
			file_id: "mock",
			plugin_key: "mock",
			schema_key: "mock",
			snapshot_id: "no-content",
		},
	] as const satisfies NewChange[];

	await lix.db.insertInto("change").values(mockChanges).execute();
	await lix.db
		.insertInto("change_edge")
		.values([{ parent_id: "0", child_id: "1" }])
		.execute();

	const commonAncestors = await lix.db
		.selectFrom("change")
		.where(changeIsLowestCommonAncestorOf([mockChanges[1], mockChanges[2]]))
		.selectAll()
		.execute();

	expect(commonAncestors).toHaveLength(0);
});

test.skip("it should succeed if one of the given changes is the common ancestor", async () => {
	const lix = await openLixInMemory({});

	const mockChanges = [
		{
			id: "0",
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock",
			schema_key: "mock",
			snapshot_id: "no-content",
			created_at: "mock",
		},
		{
			id: "1",
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock",
			schema_key: "mock",
			snapshot_id: "no-content",
			created_at: "mock",
		},
	] as const satisfies NewChange[];

	const edges = [{ parent_id: "0", child_id: "1" }];

	await lix.db.insertInto("change").values(mockChanges).execute();
	await lix.db.insertInto("change_edge").values(edges).execute();

	const commonAncestors = await lix.db
		.selectFrom("change")
		.where(changeIsLowestCommonAncestorOf([mockChanges[0], mockChanges[1]]))
		.selectAll()
		.execute();

	expect(commonAncestors).toHaveLength(1);
	expect(commonAncestors[0]?.id).toBe("0");
});
