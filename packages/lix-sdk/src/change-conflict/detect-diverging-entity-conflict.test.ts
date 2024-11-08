import { expect, test } from "vitest";
import type { Change } from "../database/schema.js";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import {
	detectDivergingEntityConflict,
	LIX_DIVERGING_ENTITY_CONFLICT_KEY,
} from "./detect-diverging-entity-conflict.js";

test("it should detect a diverging entity conflict", async () => {
	const lix = await openLixInMemory({});

	const mockChanges: Change[] = [
		{
			id: "change1",
			created_at: "mock",
			plugin_key: "plugin1",
			type: "mock",
			file_id: "mock",
			entity_id: "value1",
			snapshot_id: "no-content",
		},
		{
			id: "change2",
			created_at: "mock",
			plugin_key: "plugin1",
			file_id: "mock",
			entity_id: "value1",
			type: "mock",
			snapshot_id: "no-content",
		},
		{
			id: "change3",
			created_at: "mock",
			plugin_key: "plugin1",
			file_id: "mock",
			entity_id: "value1",
			type: "mock",
			snapshot_id: "no-content",
		},
	];

	await lix.db
		.insertInto("change")
		.values(mockChanges)
		.returningAll()
		.execute();

	await lix.db
		.insertInto("change_graph_edge")
		.values([
			{ parent_id: "change1", child_id: "change2" },
			{ parent_id: "change1", child_id: "change3" },
		])
		.execute();

	const result = await detectDivergingEntityConflict({
		lix: lix,
		changeA: { id: "change2" },
		changeB: { id: "change3" },
	});

	expect(result).toEqual({
		key: LIX_DIVERGING_ENTITY_CONFLICT_KEY,
		conflicting_change_ids: new Set(["change2", "change3"]),
	});
});

test("it should return undefined if no conflict exists (determined by finding the lowest common ancestor)", async () => {
	const lix = await openLixInMemory({});

	const mockChanges: Change[] = [
		{
			id: "change1",
			created_at: "mock",
			plugin_key: "plugin1",
			type: "mock",
			file_id: "mock",
			entity_id: "value1",
			snapshot_id: "no-content",
		},
		{
			id: "change2",
			created_at: "mock",
			plugin_key: "plugin1",
			file_id: "mock",
			entity_id: "value1",
			type: "mock",
			snapshot_id: "no-content",
		},
		{
			id: "change3",
			created_at: "mock",
			plugin_key: "plugin1",
			file_id: "mock",
			entity_id: "value2",
			type: "mock",
			snapshot_id: "no-content",
		},
	];

	await lix.db
		.insertInto("change")
		.values(mockChanges)
		.returningAll()
		.execute();

	await lix.db
		.insertInto("change_graph_edge")
		.values([
			{ parent_id: "change1", child_id: "change2" },
			// change3 has no parent
		])
		.execute();

	const result = await detectDivergingEntityConflict({
		lix: lix,
		changeA: { id: "change2" },
		changeB: { id: "change3" },
	});

	expect(result).toBeUndefined();
});

test("it should return undefined if one of either change is the lowest common ancestor", async () => {
	const lix = await openLixInMemory({});

	const mockChanges: Change[] = [
		{
			id: "change1",
			created_at: "mock",
			plugin_key: "plugin1",
			type: "mock",
			file_id: "mock",
			entity_id: "value1",
			snapshot_id: "no-content",
		},
		{
			id: "change2",
			created_at: "mock",
			plugin_key: "plugin1",
			file_id: "mock",
			entity_id: "value1",
			type: "mock",
			snapshot_id: "no-content",
		},
	];

	await lix.db
		.insertInto("change")
		.values(mockChanges)
		.returningAll()
		.execute();

	await lix.db
		.insertInto("change_graph_edge")
		.values([
			// change 1 is the lowest common ancestor of change2
			{ parent_id: "change1", child_id: "change2" },
		])
		.execute();

	const result = await detectDivergingEntityConflict({
		lix: lix,
		changeA: { id: "change1" },
		changeB: { id: "change2" },
	});

	expect(result).toBeUndefined();
});
