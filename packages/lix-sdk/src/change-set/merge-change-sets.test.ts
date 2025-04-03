import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { applyChangeSet } from "./apply-change-set.js";
import { mergeChangeSets } from "./merge-change-sets.js";
import { changeSetElementInAncestryOf } from "../query-filter/change-set-element-in-ancestry-of.js";
import { changeSetElementIsLeafOf } from "../query-filter/change-set-element-is-leaf-of.js";
import { createChangeSet } from "./create-change-set.js";

test("it should merge non-conflicting changes", async () => {
	const lix = await openLixInMemory({});

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "c0",
				entity_id: "e0",
				file_id: "file0",
				plugin_key: "mock_plugin",
				schema_key: "test_schema",
				snapshot_id: "no-content",
			},
			{
				id: "c1",
				entity_id: "e1",
				file_id: "file0",
				plugin_key: "mock_plugin",
				schema_key: "test_schema",
				snapshot_id: "no-content",
			},
			{
				id: "c2",
				entity_id: "e2",
				file_id: "file0",
				plugin_key: "mock_plugin",
				schema_key: "test_schema",
				snapshot_id: "no-content",
			},
		])
		.returningAll()
		.execute();

	const cs0 = await createChangeSet({
		lix,
		changes: [changes[0]!],
	});

	const cs1 = await createChangeSet({
		lix,
		changes: [changes[1]!],
	});

	// simulating graph relation
	const cs2 = await createChangeSet({
		lix,
		changes: [changes[2]!],
		parents: [cs1],
	});

	const merged = await mergeChangeSets({
		lix,
		source: cs0,
		target: cs2,
	});

	const mergedElements = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_element.change_set_id", "=", merged.id)
		.selectAll()
		.execute();

	expect(mergedElements).toHaveLength(3);
	expect(mergedElements).toEqual(
		changes.map((c) => ({
			change_set_id: merged.id,
			change_id: c.id,
			entity_id: c.entity_id,
			schema_key: c.schema_key,
			file_id: c.file_id,
		}))
	);
});

test("should handle conflicting elements with last change winning", async () => {
	const lix = await openLixInMemory({});

	// Create initial snapshots with different content
	const snapshots = await lix.db
		.insertInto("snapshot")
		.values([
			{ content: { text: "base" } },
			{ content: { text: "target mod" } },
			{ content: { text: "source mod" } },
		])
		.returning("id")
		.execute();

	// Create changes for the different states of the same entity
	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "c_base",
				entity_id: "e1",
				file_id: "file1",
				plugin_key: "mock_plugin",
				schema_key: "s1",
				snapshot_id: snapshots[0]!.id,
			},
			{
				id: "c_target",
				entity_id: "e1", // Same entity as base, different content
				file_id: "file1",
				plugin_key: "mock_plugin",
				schema_key: "s1",
				snapshot_id: snapshots[1]!.id,
			},
			{
				id: "c_source",
				entity_id: "e1", // Same entity as base, different content
				file_id: "file1",
				plugin_key: "mock_plugin",
				schema_key: "s1",
				snapshot_id: snapshots[2]!.id,
			},
		])
		.returningAll()
		.execute();

	// 1. Base change set with initial content
	const cs_base = await createChangeSet({
		lix,
		id: "cs_base",
		changes: [changes[0]!], // base content for e1
	});

	// 2. Target branch - modifies e1
	const cs_target = await createChangeSet({
		lix,
		id: "cs_target",
		changes: [changes[1]!], // target modification for e1
		parents: [cs_base],
	});

	// 3. Source branch - modifies e1 differently
	const cs_source = await createChangeSet({
		lix,
		id: "cs_source",
		changes: [changes[2]!], // source modification for e1
		parents: [cs_base],
	});

	// 4. Merge source into target
	const merged = await mergeChangeSets({
		lix,
		source: cs_source,
		target: cs_target,
	});

	// 5. Verify merged change set elements
	const mergedElements = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_element.change_set_id", "=", merged.id)
		.selectAll()
		.execute();

	// Should contain the source change as it's the "winning" change
	expect(mergedElements).toHaveLength(1);
	expect(mergedElements[0]).toEqual({
		change_set_id: merged.id,
		change_id: changes[2]!.id, // Source change should win
		entity_id: changes[2]!.entity_id,
		schema_key: changes[2]!.schema_key,
		file_id: changes[2]!.file_id,
	});

	// 6. Verify graph structure
	const edges = await lix.db
		.selectFrom("change_set_edge")
		.where("child_id", "=", merged.id)
		.selectAll()
		.execute();

	expect(edges).toHaveLength(2);
	expect(edges.map((e) => e.parent_id).sort()).toEqual(
		[cs_source.id, cs_target.id].sort()
	);
});

test("should handle source delete and target modify with last change winning", async () => {
	const dbPath = `.test-merge-delete-modify-conflict-${randomUUID()}.db`;
	try {
		await rm(dbPath);
	} catch {
		// Ignore if file doesn't exist
	}

	const lix = await openLixInMemory({ dbPath });

	// 1. Base state
	const { id: cs1 } = await applyChangeSet({
		lix,
		changeSet: {
			elements: [
				{ entityId: "e1", schemaKey: "s1", value: "base", operations: [] },
			],
		},
	});

	// 2. Target branch modifies e1
	const { id: cs2 } = await applyChangeSet({
		lix,
		changeSet: {
			elements: [
				{
					entityId: "e1",
					schemaKey: "s1",
					value: "target mod",
					operations: [],
				},
			],
		},
		dependsOn: [cs1],
	});

	// 3. Source branch deletes e1 (value: null signifies deletion)
	const { id: cs3 } = await applyChangeSet({
		lix,
		changeSet: {
			elements: [
				{ entityId: "e1", schemaKey: "s1", value: null, operations: [] },
			],
		},
		dependsOn: [cs1],
	});

	// 4. Merge source into target
	const { changeSetId: mergeCsId } = await mergeChangeSets({
		lix,
		source: cs3,
		target: cs2,
	});
	expect(mergeCsId).toBeDefined();

	// 5. Verify state - entity should be deleted (source delete wins as last change)
	const mergedElements = await lix.db
		.selectFrom("change_set_element")
		.innerJoin("change", "change.id", "change_set_element.change_id")
		.where(changeSetElementInAncestryOf({ id: mergeCsId }))
		.where(changeSetElementIsLeafOf({ id: mergeCsId }))
		.select([
			"change.entity_id as entityId",
			"change.file_id as fileId",
			"change.schema_key as schemaKey",
			"change_set_element.value",
			"change_set_element.operations",
		])
		.execute();

	expect(mergedElements).toEqual([]);

	await lix.db.destroy();
	await rm(dbPath);
});

test("mergeChangeSets should handle target delete and source modify with last change winning", async () => {
	const dbPath = `.test-merge-modify-delete-conflict-${randomUUID()}.db`;
	try {
		await rm(dbPath);
	} catch {
		// Ignore if file doesn't exist
	}

	const lix = await openLixInMemory({ dbPath });

	// 1. Base state
	const { id: cs1 } = await applyChangeSet({
		lix,
		changeSet: {
			elements: [
				{ entityId: "e1", schemaKey: "s1", value: "base", operations: [] },
			],
		},
	});

	// 2. Target branch deletes e1
	const { id: cs2 } = await applyChangeSet({
		lix,
		changeSet: {
			elements: [
				{ entityId: "e1", schemaKey: "s1", value: null, operations: [] },
			],
		},
		dependsOn: [cs1],
	});

	// 3. Source branch modifies e1
	const { id: cs3 } = await applyChangeSet({
		lix,
		changeSet: {
			elements: [
				{
					entityId: "e1",
					schemaKey: "s1",
					value: "source mod",
					operations: [],
				},
			],
		},
		dependsOn: [cs1],
	});

	// 4. Merge source into target
	const { changeSetId: mergeCsId } = await mergeChangeSets({
		lix,
		source: cs3,
		target: cs2,
	});
	expect(mergeCsId).toBeDefined();

	// 5. Verify state - source modification should win (last change)
	const mergedElements = await lix.db
		.selectFrom("change_set_element")
		.innerJoin("change", "change.id", "change_set_element.change_id")
		.where(changeSetElementInAncestryOf({ id: mergeCsId }))
		.where(changeSetElementIsLeafOf({ id: mergeCsId }))
		.select([
			"change.entity_id as entityId",
			"change.file_id as fileId",
			"change.schema_key as schemaKey",
			"change_set_element.value",
			"change_set_element.operations",
		])
		.execute();

	expect(mergedElements).toEqual([
		{
			entityId: "e1",
			fileId: null,
			schemaKey: "s1",
			value: "source mod",
			operations: [],
		},
	]);

	await lix.db.destroy();
	await rm(dbPath);
});

test("should handle conflicting add/add with last change winning", async () => {
	const dbPath = `.test-merge-add-add-conflict-${randomUUID()}.db`;
	try {
		await rm(dbPath);
	} catch {
		// Ignore if file doesn't exist
	}

	const lix = await openLixInMemory({ dbPath });

	// 1. Base state (cs1) - empty or irrelevant element
	const { id: cs1 } = await applyChangeSet({
		lix,
		changeSet: {
			elements: [
				{ entityId: "e0", schemaKey: "s0", value: "base", operations: [] },
			],
		},
	});

	// 2. Target branch (cs2 adds e1)
	const { id: cs2 } = await applyChangeSet({
		lix,
		changeSet: {
			elements: [
				{
					entityId: "e1",
					schemaKey: "s1",
					value: "target add",
					operations: [],
				},
			],
		},
		dependsOn: [cs1],
	});

	// 3. Source branch (cs3 adds e1 with different value)
	const { id: cs3 } = await applyChangeSet({
		lix,
		changeSet: {
			elements: [
				{
					entityId: "e1",
					schemaKey: "s1",
					value: "source add",
					operations: [],
				},
			],
		},
		dependsOn: [cs1],
	});

	// 4. Merge source (cs3) into target (cs2)
	const { changeSetId: mergeCsId } = await mergeChangeSets({
		lix,
		source: cs3,
		target: cs2,
	});
	expect(mergeCsId).toBeDefined();

	// 5. Verify the state at the merge change set - source add should win (last change)
	const mergedElements = await lix.db
		.selectFrom("change_set_element")
		.innerJoin("change", "change.id", "change_set_element.change_id")
		.where(changeSetElementInAncestryOf({ id: mergeCsId }))
		.where(changeSetElementIsLeafOf({ id: mergeCsId }))
		.select([
			"change.entity_id as entityId",
			"change.file_id as fileId",
			"change.schema_key as schemaKey",
			"change_set_element.value",
			"change_set_element.operations",
		])
		.execute();

	expect(mergedElements).toEqual(
		expect.arrayContaining([
			{
				entityId: "e0",
				fileId: null,
				schemaKey: "s0",
				value: "base",
				operations: [],
			},
			{
				entityId: "e1",
				fileId: null,
				schemaKey: "s1",
				value: "source add",
				operations: [],
			},
		])
	);
	expect(mergedElements).toHaveLength(2);

	await lix.db.destroy();
	await rm(dbPath);
});
