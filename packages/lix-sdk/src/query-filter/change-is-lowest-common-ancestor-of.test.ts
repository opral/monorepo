import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { changeIsLowestCommonAncestorOf } from "./change-is-lowest-common-ancestor-of.js";
import type { NewChange } from "../database/schema.js";

test("it should find the common parent of multiple changes recursively", async () => {
	const lix = await openLixInMemory({});

	const mockChanges = [
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
			id: "1",
			entity_id: "value1",
			file_id: "mock",
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
			id: "4",
			file_id: "mock",
			entity_id: "value1",
			plugin_key: "mock",
			schema_key: "mock",
			created_at: "mock",
			snapshot_id: "no-content",
		},
	] as const satisfies NewChange[];

	const edges = [
		{ parent_id: "common", child_id: "1" },
		{ parent_id: "common", child_id: "2" },
		{ parent_id: "1", child_id: "3" },
		{ parent_id: "2", child_id: "4" },
	];

	await lix.db.insertInto("change").values(mockChanges).execute();
	await lix.db.insertInto("change_edge").values(edges).execute();

	const lcaChanges = await lix.db
		.selectFrom("change")
		.where(changeIsLowestCommonAncestorOf([mockChanges[3], mockChanges[4]]))
		.selectAll()
		.execute();

	expect(lcaChanges).toHaveLength(1);
	expect(lcaChanges[0]?.id).toBe("common");
});

test("it should return no results if no common parent exists", async () => {
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

	const lcaChanges = await lix.db
		.selectFrom("change")
		.where(changeIsLowestCommonAncestorOf([mockChanges[1], mockChanges[2]]))
		.selectAll()
		.execute();

	expect(lcaChanges).toHaveLength(0);
});

test("it should succeed if one of the given changes is the common ancestor", async () => {
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

	const lcaChanges = await lix.db
		.selectFrom("change")
		.where(changeIsLowestCommonAncestorOf([mockChanges[0], mockChanges[1]]))
		.selectAll()
		.execute();

	expect(lcaChanges).toHaveLength(1);
	expect(lcaChanges[0]?.id).toBe("0");
});
