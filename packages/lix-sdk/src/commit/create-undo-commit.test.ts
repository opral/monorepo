import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createUndoCommit } from "./create-undo-commit.js";
import { createChangeSet } from "../change-set/create-change-set.js";
import { createCommit } from "./create-commit.js";
import { applyCommit } from "./apply-commit.js";
import {
	mockJsonPlugin,
	MockJsonPropertySchema,
} from "../plugin/mock-json-plugin.js";
import { createCheckpoint } from "./create-checkpoint.js";

test("it creates an undo commit that reverses the operations of the original commit", async () => {
	// Create a Lix instance with the mockJsonPlugin
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
	});

	// Insert the schema that the mockJsonPlugin uses
	await lix.db
		.insertInto("stored_schema_all")
		.values({
			value: MockJsonPropertySchema,
			lixcol_version_id: "global",
		})
		.execute();

	// Create a file
	await lix.db
		.insertInto("file")
		.values({
			id: "file1",
			data: new TextEncoder().encode("{}"),
			path: "/test.json",
		})
		.execute();

	const file = await lix.db
		.selectFrom("file")
		.where("id", "=", "file1")
		.selectAll()
		.executeTakeFirstOrThrow();

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
				snapshot_content: { value: "Value 1" },
				schema_version: "1.0",
			},
			{
				id: "c2",
				file_id: file.id,
				plugin_key: mockJsonPlugin.key,
				entity_id: "e2",
				schema_key: "mock_json_property",
				snapshot_content: { value: "Value 2" },
				schema_version: "1.0",
			},
		])
		.returningAll()
		.execute();

	// Create a change set with these changes
	const cs0 = await createChangeSet({
		lix,
		id: "cs0",
		lixcol_version_id: "global",
		elements: changes.map((change) => ({
			lixcol_version_id: "global",
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
	});

	// Create a commit for the change set
	const commit0 = await createCommit({
		lix,
		changeSet: cs0,
	});

	await applyCommit({
		lix,
		commit: commit0,
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

	// Create the undo commit
	const undoCommit = await createUndoCommit({
		lix,
		commit: commit0,
	});

	// Verify the undo commit has the original commit as parent
	const edges = await lix.db
		.selectFrom("commit_edge")
		.selectAll()
		.where("child_id", "=", undoCommit.id)
		.execute();

	expect(edges).toHaveLength(1);
	expect(edges[0]?.parent_id).toBe(commit0.id);

	await applyCommit({
		lix,
		commit: undoCommit,
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
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
	});

	// Insert the schema that the mockJsonPlugin uses
	await lix.db
		.insertInto("stored_schema_all")
		.values({
			value: MockJsonPropertySchema,
			lixcol_version_id: "global",
		})
		.execute();

	// Create a file
	await lix.db
		.insertInto("file")
		.values({
			id: "file1",
			data: new TextEncoder().encode("{}"),
			path: "/test.json",
		})
		.execute();

	const file = await lix.db
		.selectFrom("file")
		.where("id", "=", "file1")
		.selectAll()
		.executeTakeFirstOrThrow();

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
				schema_version: "1.0",
				snapshot_content: { value: "Initial Value" },
			},
		])
		.returningAll()
		.execute();

	const cs0 = await createChangeSet({
		lix,
		id: "cs0",
		lixcol_version_id: "global",
		elements: initialChanges.map((change) => ({
			change_id: change.id,
			lixcol_version_id: "global",
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
	});

	// Create a commit for cs0
	const commit0 = await createCommit({
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
				schema_version: "1.0",
				snapshot_content: null, // This marks it as a delete operation
			},
		])
		.returningAll()
		.execute();

	// Create cs1 with cs0 as parent (don't apply yet)
	const cs1 = await createChangeSet({
		lix,
		id: "cs1",
		lixcol_version_id: "global",
		elements: deleteChanges.map((change) => ({
			change_id: change.id,
			lixcol_version_id: "global",
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
	});

	// Create a commit for cs1
	const commit1 = await createCommit({
		lix,
		changeSet: cs1,
		parentCommits: [commit0],
	});

	// Create undo commit for the delete operation
	const undoDeleteCommit = await createUndoCommit({
		lix,
		commit: commit1,
	});

	await applyCommit({
		lix,
		commit: undoDeleteCommit,
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

test.skip("does not naively create delete changes if a previous state existed", async () => {
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
	});

	// Insert the schema that the mockJsonPlugin uses
	await lix.db
		.insertInto("stored_schema_all")
		.values({
			value: MockJsonPropertySchema,
			lixcol_version_id: "global",
		})
		.execute();

	const file = await lix.db
		.insertInto("file")
		.values({
			id: "file1",
			data: new TextEncoder().encode("{}"),
			path: "/test.json",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	const checkpoints: Array<{ id: string }> = [];

	// simulating an undo of peter which should restore { name: "samuel", age: 20 }
	for (const state of [
		{ name: "Samuel", age: 20 },
		{ name: "Peter", age: 20 },
	]) {
		await lix.db
			.updateTable("file")
			.set({ data: new TextEncoder().encode(JSON.stringify(state)) })
			.execute();

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

	const undoCommit = await createUndoCommit({
		lix,
		commit: checkpoints[1]!,
	});

	await applyCommit({
		lix,
		commit: undoCommit,
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
