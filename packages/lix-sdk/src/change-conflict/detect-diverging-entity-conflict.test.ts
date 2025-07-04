// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { expect, test } from "vitest";
import type { Change } from "../database/schema.js";
import { openLix } from "../lix/open-lix.js";
import {
	detectDivergingEntityConflict,
	LIX_DIVERGING_ENTITY_CONFLICT_KEY,
} from "./detect-diverging-entity-conflict.js";
import type { DetectedConflict } from "../plugin/lix-plugin.js";

test.skip("it should detect a diverging entity conflict", async () => {
	const lix = await openLix({});

	const mockChanges = [
		{
			id: "change0",
			created_at: "mock",
			plugin_key: "plugin1",
			schema_key: "mock",
			file_id: "mock",
			entity_id: "value1",
			snapshot_content: null,
		},
		{
			id: "change1",
			created_at: "mock",
			plugin_key: "plugin1",
			file_id: "mock",
			entity_id: "value1",
			schema_key: "mock",
			snapshot_content: null,
		},
		{
			id: "change2",
			created_at: "mock",
			plugin_key: "plugin1",
			file_id: "mock",
			entity_id: "value1",
			schema_key: "mock",
			snapshot_content: null,
		},
	] as const satisfies Change[];

	await lix.db
		.insertInto("change")
		.values(mockChanges)
		.returningAll()
		.execute();

	await lix.db
		.insertInto("change_edge")
		.values([
			{ parent_id: "change0", child_id: "change1" },
			{ parent_id: "change0", child_id: "change2" },
		])
		.execute();

	const result = await detectDivergingEntityConflict({
		lix: lix,
		changes: [mockChanges[1], mockChanges[2]],
	});

	expect(result).toEqual({
		key: LIX_DIVERGING_ENTITY_CONFLICT_KEY,
		conflictingChangeIds: new Set(["change1", "change2"]),
	} satisfies DetectedConflict);
});

test.skip("it should return a conflict if no common ancestor is found (two clients created different entities without being aware of it (aka distributed system))", async () => {
	const lix = await openLix({});

	const mockChanges = [
		{
			id: "change0",
			created_at: "mock",
			plugin_key: "plugin1",
			schema_key: "mock",
			file_id: "mock",
			entity_id: "value1",
			snapshot_content: null,
		},
		{
			id: "change1",
			created_at: "mock",
			plugin_key: "plugin1",
			schema_key: "mock",
			file_id: "mock",
			entity_id: "value1",
			snapshot_content: null,
		},
		{
			id: "change2",
			created_at: "mock",
			plugin_key: "plugin1",
			schema_key: "mock",
			file_id: "mock",
			entity_id: "value2",
			snapshot_content: null,
		},
	] as const satisfies Change[];

	await lix.db
		.insertInto("change")
		.values(mockChanges)
		.returningAll()
		.execute();

	const result = await detectDivergingEntityConflict({
		lix: lix,
		changes: [mockChanges[0], mockChanges[1]],
	});

	expect(result).toEqual({
		key: LIX_DIVERGING_ENTITY_CONFLICT_KEY,
		conflictingChangeIds: new Set(["change0", "change1"]),
	} satisfies DetectedConflict);
});

test.skip("it should return undefined if one of either change is the lowest common ancestor", async () => {
	const lix = await openLix({});

	const mockChanges = [
		{
			id: "change0",
			created_at: "mock",
			plugin_key: "plugin1",
			schema_key: "mock",
			file_id: "mock",
			entity_id: "value1",
			snapshot_content: null,
		},
		{
			id: "change1",
			created_at: "mock",
			plugin_key: "plugin1",
			file_id: "mock",
			entity_id: "value1",
			schema_key: "mock",
			snapshot_content: null,
		},
	] as const satisfies Change[];

	await lix.db
		.insertInto("change")
		.values(mockChanges)
		.returningAll()
		.execute();

	await lix.db
		.insertInto("change_edge")
		.values([
			// change 1 is the lowest common ancestor of change2
			{ parent_id: "change0", child_id: "change1" },
		])
		.execute();

	const result = await detectDivergingEntityConflict({
		lix: lix,
		changes: [mockChanges[0], mockChanges[1]],
	});

	expect(result).toBeUndefined();
});

test.skip("it should detect a diverging entity conflict with multiple divering entity changes", async () => {
	const lix = await openLix({});

	const mockChanges = [
		{
			id: "change0",
			created_at: "mock",
			plugin_key: "plugin1",
			schema_key: "mock",
			file_id: "mock",
			entity_id: "value1",
			snapshot_content: null,
		},
		{
			id: "change1",
			created_at: "mock",
			plugin_key: "plugin1",
			file_id: "mock",
			entity_id: "value1",
			schema_key: "mock",
			snapshot_content: null,
		},
		{
			id: "change2",
			created_at: "mock",
			plugin_key: "plugin1",
			file_id: "mock",
			entity_id: "value1",
			schema_key: "mock",
			snapshot_content: null,
		},
		{
			id: "change3",
			created_at: "mock",
			plugin_key: "plugin1",
			file_id: "mock",
			entity_id: "value1",
			schema_key: "mock",
			snapshot_content: null,
		},
	] as const satisfies Change[];

	await lix.db.insertInto("change").values(mockChanges).execute();

	await lix.db
		.insertInto("change_edge")
		.values([
			// change 0 is the lowest common ancestor of change1, change2, and change3
			// which means that 1,2,3 are diverging
			{ parent_id: "change0", child_id: "change1" },
			{ parent_id: "change0", child_id: "change2" },
			{ parent_id: "change0", child_id: "change3" },
		])
		.execute();

	const result = await detectDivergingEntityConflict({
		lix: lix,
		changes: [mockChanges[1], mockChanges[2], mockChanges[3]],
	});

	expect(result).toEqual({
		key: LIX_DIVERGING_ENTITY_CONFLICT_KEY,
		conflictingChangeIds: new Set(["change1", "change2", "change3"]),
	} satisfies DetectedConflict);
});
