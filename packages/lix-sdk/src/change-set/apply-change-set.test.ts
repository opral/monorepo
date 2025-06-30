import { test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { applyChangeSet } from "./apply-change-set.js";
import { createChangeSet } from "./create-change-set.js";
import {
	mockJsonPlugin,
	MockJsonPropertySchema,
} from "../plugin/mock-json-plugin.js";
import type { Change } from "../change/schema.js";
import type { KeyValue } from "../key-value/schema.js";
import { createCheckpoint } from "./create-checkpoint.js";

test("it applies lix own entity changes", async () => {
	const lix = await openLix({});

	const mockKeyValue = {
		key: "test",
		value: "something",
	} as const satisfies KeyValue;

	const mockKeyValueChange: Change = {
		id: "change1",
		file_id: "lix",
		plugin_key: "lix_own_entity",
		snapshot_content: mockKeyValue,
		entity_id: "test", // entity_id should match the key
		schema_key: "lix_key_value",
		schema_version: "1.0",
		created_at: new Date().toISOString(),
	};

	await lix.db.insertInto("change").values(mockKeyValueChange).execute();

	const changeSet = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: [
			{
				change_id: mockKeyValueChange.id,
				entity_id: mockKeyValueChange.entity_id,
				schema_key: mockKeyValueChange.schema_key,
				file_id: mockKeyValueChange.file_id,
			},
		],
	});

	const kvBeforeApply = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "test")
		.selectAll()
		.execute();

	expect(kvBeforeApply).toHaveLength(0);

	await applyChangeSet({ lix, changeSet });

	const kvAfterApply = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "test")
		.selectAll()
		.execute();

	expect(kvAfterApply).toHaveLength(1);
	expect(kvAfterApply[0]).toMatchObject(mockKeyValue);
});

test("it applies the changes associated with the change set", async () => {
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
	});

	// Insert a JSON file with initial content
	await lix.db
		.insertInto("file")
		.values({
			id: "file1",
			data: new TextEncoder().encode(JSON.stringify({ test: "initial-value" })),
			path: "/test.json",
		})
		.execute();

	// Update the file to trigger change detection by the mock json plugin
	await lix.db
		.updateTable("file")
		.set({
			data: new TextEncoder().encode(JSON.stringify({ test: "updated-value" })),
		})
		.where("id", "=", "file1")
		.execute();

	// Get the changes that were automatically detected by the mockJsonPlugin
	const checkpoint = await createCheckpoint({ lix });

	// Reset the file to initial state to test applying the change set
	await lix.db
		.updateTable("file")
		.set({
			data: new TextEncoder().encode(JSON.stringify({ test: "initial-value" })),
		})
		.where("id", "=", "file1")
		.execute();

	// Apply the change set
	await applyChangeSet({ lix, changeSet: checkpoint });

	// Verify file data was updated by the mock plugin via applyChangeSet
	const updatedFile = await lix.db
		.selectFrom("file")
		.where("id", "=", "file1")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Check that the mock json plugin logic was applied
	const resultJson = JSON.parse(new TextDecoder().decode(updatedFile.data));
	expect(resultJson.test).toBe("updated-value");
});

test("throws an error if plugin does not exist", async () => {
	const lix = await openLix({});

	// Insert a file
	await lix.db
		.insertInto("file")
		.values({
			id: "file1",
			data: new TextEncoder().encode("initial-data"),
			path: "/test1.txt",
		})
		.execute();

	const file = await lix.db
		.selectFrom("file")
		.where("id", "=", "file1")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Insert a change linked to a non-existent plugin
	await lix.db
		.insertInto("change")
		.values({
			id: "changeB",
			file_id: file.id,
			plugin_key: "non-existent-plugin",
			snapshot_content: { value: "test" },
			entity_id: "entity2",
			schema_key: "lix_key_value",
			schema_version: "1.0",
			created_at: new Date().toISOString(),
		})
		.execute();

	const change = await lix.db
		.selectFrom("change")
		.where("id", "=", "changeB")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Create a change set
	const changeSet = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: [
			{
				change_id: change.id,
				entity_id: change.entity_id,
				schema_key: change.schema_key,
				file_id: change.file_id,
			},
		],
	});

	// Apply change set and verify error for missing plugin
	await expect(applyChangeSet({ lix, changeSet })).rejects.toThrow(
		"Plugin with key non-existent-plugin not found"
	);
});

test("throws an error if plugin does not support applying changes", async () => {
	// Mock plugin without applyChanges function
	const mockPlugin = { key: "plugin-no-apply" };
	const lix = await openLix({ providePlugins: [mockPlugin] });

	// Insert a file
	await lix.db
		.insertInto("file")
		.values({
			id: "file2",
			data: new TextEncoder().encode("initial-data-2"),
			path: "/test2.txt",
		})
		.execute();

	const file = await lix.db
		.selectFrom("file")
		.where("id", "=", "file2")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Insert a change linked to the mock plugin
	await lix.db
		.insertInto("change")
		.values({
			id: "changeC",
			file_id: file.id,
			plugin_key: mockPlugin.key,
			snapshot_content: { value: "test2" },
			entity_id: "entity3",
			schema_key: "lix_key_value",
			schema_version: "1.0",
			created_at: new Date().toISOString(),
		})
		.execute();

	const change = await lix.db
		.selectFrom("change")
		.where("id", "=", "changeC")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Create a change set
	const changeSet = await createChangeSet({
		lix,
		lixcol_version_id: "global",
		elements: [
			{
				change_id: change.id,
				entity_id: change.entity_id,
				schema_key: change.schema_key,
				file_id: change.file_id,
			},
		],
	});

	// Apply change set and verify error for unsupported applyChanges
	await expect(applyChangeSet({ lix, changeSet })).rejects.toThrow(
		`Plugin with key ${mockPlugin.key} does not support applying changes`
	);
});

// very slow https://github.com/opral/lix-sdk/issues/311
test("file deletion bypasses plugin and removes file from state", async () => {
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
	});

	// Insert a JSON file with initial content
	await lix.db
		.insertInto("file")
		.values({
			id: "file-to-delete",
			data: new TextEncoder().encode(
				JSON.stringify({ test: "will-be-deleted" })
			),
			path: "/delete-test.json",
		})
		.execute();

	// Update the file to trigger change detection by the mock json plugin
	await lix.db
		.updateTable("file")
		.set({
			data: new TextEncoder().encode(
				JSON.stringify({ test: "updated-before-delete" })
			),
		})
		.where("id", "=", "file-to-delete")
		.execute();

	await createCheckpoint({ lix });

	// Now delete the file
	await lix.db.deleteFrom("file").where("id", "=", "file-to-delete").execute();

	// Create checkpoint to capture the file deletion
	const checkpointAfterDeletion = await createCheckpoint({ lix });

	// Verify file is deleted
	const fileAfterDeletion = await lix.db
		.selectFrom("file")
		.where("id", "=", "file-to-delete")
		.selectAll()
		.executeTakeFirst();

	expect(fileAfterDeletion).toBeUndefined();

	// Recreate the file to test applying the deletion change set
	await lix.db
		.insertInto("file")
		.values({
			id: "file-to-delete",
			data: new TextEncoder().encode(
				JSON.stringify({ test: "recreated-file" })
			),
			path: "/delete-test.json",
		})
		.execute();

	// Verify file is recreated
	const recreatedFile = await lix.db
		.selectFrom("file")
		.where("id", "=", "file-to-delete")
		.selectAll()
		.executeTakeFirst();

	expect(recreatedFile).toBeDefined();
	// Apply the deletion change set
	await applyChangeSet({ lix, changeSet: checkpointAfterDeletion });

	// Verify file is deleted again after applying change set
	const finalFile = await lix.db
		.selectFrom("file")
		.where("id", "=", "file-to-delete")
		.selectAll()
		.executeTakeFirst();

	expect(finalFile).toBeUndefined();
});

test("it should delete entities but not files when applying entity deletion changes", async () => {
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

	// 1. Create a file
	await lix.db
		.insertInto("file")
		.values({
			id: "test-file",
			data: new TextEncoder().encode("{}"),
			path: "/test.json",
		})
		.execute();

	const file = await lix.db
		.selectFrom("file")
		.where("id", "=", "test-file")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Create changes that add entities to the file
	await lix.db
		.insertInto("change")
		.values([
			{
				id: "c1",
				file_id: file.id,
				plugin_key: mockJsonPlugin.key,
				entity_id: "e1",
				schema_key: "mock_json_property",
				schema_version: "1.0",
				snapshot_content: { value: "Entity 1" },
			},
			{
				id: "c2",
				file_id: file.id,
				plugin_key: mockJsonPlugin.key,
				entity_id: "e2",
				schema_key: "mock_json_property",
				schema_version: "1.0",
				snapshot_content: { value: "Entity 2" },
			},
		])
		.execute();

	// Apply changes to add entities
	const addChangeSet = await createChangeSet({
		lix,
		id: "cs-add",
		lixcol_version_id: "global",
		elements: [
			{
				change_id: "c1",
				entity_id: "e1",
				schema_key: "mock_json_property",
				file_id: file.id,
			},
			{
				change_id: "c2",
				entity_id: "e2",
				schema_key: "mock_json_property",
				file_id: file.id,
			},
		],
	});

	await applyChangeSet({
		lix,
		changeSet: addChangeSet,
	});

	// Verify file has the entities
	const fileAfterAdd = await lix.db
		.selectFrom("file")
		.where("id", "=", file.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	const contentAfterAdd = JSON.parse(
		new TextDecoder().decode(fileAfterAdd.data)
	);

	expect(contentAfterAdd).toEqual({
		e1: "Entity 1",
		e2: "Entity 2",
	});

	// 2. Create entity deletion changes (but NOT file deletion)
	await lix.db
		.insertInto("change")
		.values({
			id: "c3",
			file_id: file.id,
			plugin_key: mockJsonPlugin.key,
			entity_id: "e1",
			schema_key: "mock_json_property", // NOT "lix_file"
			schema_version: "1.0",
			snapshot_content: null, // Entity deletion
		})
		.execute();

	// 3. Apply the entity deletion change
	const deleteChangeSet = await createChangeSet({
		lix,
		id: "cs-delete-entity",
		lixcol_version_id: "global",
		elements: [
			{
				change_id: "c3",
				entity_id: "e1",
				schema_key: "mock_json_property",
				file_id: file.id,
			},
		],
	});

	await applyChangeSet({
		lix,
		changeSet: deleteChangeSet,
	});

	// Verify: The entity should be deleted, but the file should still exist
	const fileAfterEntityDeletion = await lix.db
		.selectFrom("file")
		.where("id", "=", file.id)
		.selectAll()
		.executeTakeFirst();

	// BUG: This will currently fail because the file gets incorrectly deleted
	expect(fileAfterEntityDeletion).toBeDefined();
	expect(fileAfterEntityDeletion?.id).toBe(file.id);

	// The file content should have e1 removed but e2 still present
	const contentAfterEntityDeletion = JSON.parse(
		new TextDecoder().decode(fileAfterEntityDeletion!.data)
	);
	expect(contentAfterEntityDeletion).toEqual({
		e2: "Entity 2", // e1 should be gone, e2 should remain
	});
});
