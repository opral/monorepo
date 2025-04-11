import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createUndoChangeSet } from "./create-undo-change-set.js";
import { createChangeSet } from "./create-change-set.js";
import { applyChangeSet } from "./apply-change-set.js";
import { mockJsonPlugin } from "../plugin/mock-json-plugin.js";
import { createCheckpoint } from "./create-checkpoint.js";
import type { ChangeSet } from "./database-schema.js";
import { fileQueueSettled } from "../file-queue/file-queue-settled.js";

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
			data: new TextEncoder().encode("{}"),
			path: "/test.json",
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
	const cs0 = await createChangeSet({
		lix,
		id: "cs0",
		elements: changes.map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
	});

	await applyChangeSet({
		lix,
		changeSet: cs0,
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
		changeSet: cs0,
	});

	// Verify the undo change set has no parents (the dev is reponsible or by calling applyChanges())
	const edges = await lix.db
		.selectFrom("change_set_edge")
		.selectAll()
		.where("child_id", "=", undoCs.id)
		.execute();

	expect(edges).toHaveLength(0);

	await applyChangeSet({
		lix,
		changeSet: undoCs,
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
			data: new TextEncoder().encode("{}"),
			path: "/test.json",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	await fileQueueSettled({ lix });

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

	const cs0 = await createChangeSet({
		lix,
		id: "cs0",
		elements: initialChanges.map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
	});

	await applyChangeSet({
		lix,
		changeSet: cs0,
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

	const cs1 = await createChangeSet({
		lix,
		id: "cs1",
		elements: deleteChanges.map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		parents: [cs0],
	});

	await applyChangeSet({
		lix,
		changeSet: cs1,
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
		changeSet: cs1,
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

test("undoes lix own change control changes except for graph related ones", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("key_value")
		.values({
			key: "mock_test",
			value: "hello world",
		})
		.execute();

	// checkpoint contains the key value update
	const checkpoint = await createCheckpoint({
		lix,
	});

	const undoChangeSet = await createUndoChangeSet({
		lix,
		changeSet: checkpoint,
	});

	await applyChangeSet({
		lix,
		changeSet: undoChangeSet,
	});

	const keyValues = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "mock_test")
		.selectAll()
		.executeTakeFirst();

	expect(keyValues).toBeUndefined();
});

test("does not naively create delete changes if a previous state existed", async () => {
	const lix = await openLixInMemory({
		providePlugins: [mockJsonPlugin],
	});

	const file = await lix.db
		.insertInto("file")
		.values({
			id: "file1",
			data: new TextEncoder().encode("{}"),
			path: "/test.json",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	const checkpoints: Array<ChangeSet> = [];

	// simulating an undo of peter which should restore { name: "samuel", age: 20 }
	for (const state of [
		{ name: "Samuel", age: 20 },
		{ name: "Peter", age: 20 },
	]) {
		await lix.db
			.updateTable("file")
			.set({ data: new TextEncoder().encode(JSON.stringify(state)) })
			.execute();

		await fileQueueSettled({ lix });

		checkpoints.push(await createCheckpoint({ lix }));
	}

	const fileAfterEdits = await lix.db
		.selectFrom("file")
		.where("id", "=", file.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	const jsonStateAfterEdits = JSON.parse(
		new TextDecoder().decode(fileAfterEdits.data)
	);

	expect(jsonStateAfterEdits).toEqual({
		name: "Peter",
		age: 20,
	});

	const undoChangeSet = await createUndoChangeSet({
		lix,
		changeSet: checkpoints[1]!,
	});

	await applyChangeSet({
		lix,
		changeSet: undoChangeSet!,
	});

	const fileAfterUndo = await lix.db
		.selectFrom("file")
		.where("id", "=", file.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	const jsonAfterUndo = JSON.parse(
		new TextDecoder().decode(fileAfterUndo.data)
	);

	expect(jsonAfterUndo).toEqual({
		name: "Samuel",
		age: 20,
	});
});