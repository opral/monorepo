import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createUndoChangeSet } from "./create-undo-change-set.js";
import { createChangeSet } from "./create-change-set.js";
import { applyChangeSet } from "./apply-change-set.js";
import { mockJsonPlugin } from "../plugin/mock-json-plugin.js";

test("it creates an undo change set that reverses the operations of the original change set", async () => {
	// Create a Lix instance with the mockJsonPlugin
	const lix = await openLixInMemory({
		providePlugins: [mockJsonPlugin],
	});

	// Create a file
	const file = await lix.db
		.insertInto("file")
		.values({
			id: "file1",
			data: new TextEncoder().encode(""),
			path: "/test.txt",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	// Insert snapshots with { text: "..." } content
	const snapshots = await lix.db
		.insertInto("snapshot")
		.values([
			{ content: { value: "Value 1" } },
			{ content: { value: "Value 2" } },
			{ content: { value: "Value 3" } },
		])
		.returning("id")
		.execute();

	// Create changes for our initial change set
	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "c1",
				file_id: file.id,
				plugin_key: mockJsonPlugin.key,
				entity_id: "e1",
				schema_key: "mock_json_property",
				snapshot_id: snapshots[0]!.id,
			},
			{
				id: "c2",
				file_id: file.id,
				plugin_key: mockJsonPlugin.key,
				entity_id: "e2",
				schema_key: "mock_json_property",
				snapshot_id: snapshots[1]!.id,
			},
		])
		.returningAll()
		.execute();

	// Create a change set with these changes
	const originalChangeSet = await createChangeSet({
		lix,
		id: "cs1",
		changes: changes,
	});

	// Apply the change set - use direct mode to avoid edge constraint issues
	await applyChangeSet({
		lix,
		changeSet: originalChangeSet,
		mode: { type: "direct" },
	});

	// Verify the file has the expected state
	const fileAfterOriginal = await lix.db
		.selectFrom("file")
		.where("id", "=", file.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	const expectedJsonStateOriginal = {
		e1: "Value 1",
		e2: "Value 2",
	};

	const actualJsonStateOriginal = JSON.parse(
		new TextDecoder().decode(fileAfterOriginal.data)
	);

	expect(actualJsonStateOriginal).toEqual(expectedJsonStateOriginal);

	// Create the undo change set
	const undoCs = await createUndoChangeSet({
		lix,
		changeSet: originalChangeSet,
	});

	// Verify the undo change set has no parents (the dev is reponsible or by calling applyChanges())
	const edges = await lix.db
		.selectFrom("change_set_edge")
		.selectAll()
		.where("child_id", "=", undoCs.id)
		.execute();

	expect(edges).toHaveLength(0);

	// Apply the undo change set - use direct mode to avoid edge constraint issues
	await applyChangeSet({
		lix,
		changeSet: undoCs,
		mode: { type: "direct" },
	});

	// Verify the file state after undo - should be empty again
	const fileAfterUndo = await lix.db
		.selectFrom("file")
		.where("id", "=", file.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	const actualJsonStateAfterUndo = JSON.parse(
		new TextDecoder().decode(fileAfterUndo.data)
	);

	expect(actualJsonStateAfterUndo).toEqual({});
});

test("it correctly undoes delete operations by restoring previous state", async () => {
	// Create a Lix instance with the mockJsonPlugin
	const lix = await openLixInMemory({
		providePlugins: [mockJsonPlugin],
	});

	// Create a file
	const file = await lix.db
		.insertInto("file")
		.values({
			id: "file1",
			data: new TextEncoder().encode(""),
			path: "/test.txt",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	// Create snapshots
	const snapshots = await lix.db
		.insertInto("snapshot")
		.values([
			{ content: { value: "Initial Value" } },
			{ content: { value: "Updated Value" } },
		])
		.returning("id")
		.execute();

	// First change set - add an entity
	const initialChanges = await lix.db
		.insertInto("change")
		.values([
			{
				id: "c1",
				file_id: file.id,
				plugin_key: mockJsonPlugin.key,
				entity_id: "e1",
				schema_key: "mock_json_property",
				snapshot_id: snapshots[0]!.id,
			},
		])
		.returningAll()
		.execute();

	const initialChangeSet = await createChangeSet({
		lix,
		id: "cs_initial",
		changes: initialChanges,
	});

	await applyChangeSet({
		lix,
		changeSet: initialChangeSet,
	});

	// Second change set - delete the entity
	const deleteChanges = await lix.db
		.insertInto("change")
		.values([
			{
				id: "c2",
				file_id: file.id,
				plugin_key: mockJsonPlugin.key,
				entity_id: "e1",
				schema_key: "mock_json_property",
				snapshot_id: "no-content", // This marks it as a delete operation
			},
		])
		.returningAll()
		.execute();

	const deleteChangeSet = await createChangeSet({
		lix,
		id: "cs_delete",
		changes: deleteChanges,
		parents: [initialChangeSet],
	});

	await applyChangeSet({
		lix,
		changeSet: deleteChangeSet,
	});

	// Verify the entity is deleted
	const fileAfterDelete = await lix.db
		.selectFrom("file")
		.where("id", "=", file.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	const stateAfterDelete = JSON.parse(
		new TextDecoder().decode(fileAfterDelete.data)
	);

	expect(stateAfterDelete).toEqual({});

	// Create undo change set for the delete operation
	const undoDeleteCs = await createUndoChangeSet({
		lix,
		changeSet: deleteChangeSet,
	});

	await applyChangeSet({
		lix,
		changeSet: undoDeleteCs,
	});

	// Verify the entity is restored to its previous state
	const fileAfterUndo = await lix.db
		.selectFrom("file")
		.where("id", "=", file.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	const stateAfterUndo = JSON.parse(
		new TextDecoder().decode(fileAfterUndo.data)
	);

	expect(stateAfterUndo).toEqual({
		e1: "Initial Value",
	});
});
