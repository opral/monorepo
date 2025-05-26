import { test, expect, vi } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { applyChangeSet } from "./apply-change-set.js";
import { createChangeSet } from "./create-change-set.js";
import { createSnapshot } from "../snapshot/create-snapshot.js";
import type { LixPlugin } from "../plugin/lix-plugin.js";
import { mockJsonPlugin } from "../plugin/mock-json-plugin.js";
import { changeSetElementIsLeafOf } from "../query-filter/change-set-element-is-leaf-of.js";

test("it applies the changes associated with the change set", async () => {
	const lix = await openLixInMemory({
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

	// Get the changes that were automatically detected
	const changes = await lix.db
		.selectFrom("change")
		.where("file_id", "=", "file1")
		.selectAll()
		.execute();

	// Create a change set containing all the detected changes
	const changeSet = await createChangeSet({
		lix,
		elements: changes.map(change => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
	});

	// Apply the change set
	await applyChangeSet({ lix, changeSet });

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
	const lix = await openLixInMemory({});

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

	// Create a snapshot
	const snapshot = await createSnapshot({ lix, content: { value: "test" } });

	// Insert a change linked to a non-existent plugin
	await lix.db
		.insertInto("change")
		.values({
			id: "changeB",
			file_id: file.id,
			plugin_key: "non-existent-plugin",
			snapshot_id: snapshot.id,
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
	const lix = await openLixInMemory({ providePlugins: [mockPlugin] });

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

	// Create a snapshot
	const snapshot = await createSnapshot({ lix, content: { value: "test2" } });

	// Insert a change linked to the mock plugin
	await lix.db
		.insertInto("change")
		.values({
			id: "changeC",
			file_id: file.id,
			plugin_key: mockPlugin.key,
			snapshot_id: snapshot.id,
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

test("applies changes recursively from target and all ancestors", async () => {
	// Create a mock plugin that simulates a document with multiple rows
	// Each change will modify a specific row identified by entity_id
	const mockPlugin: LixPlugin = {
		key: "recursive-test-plugin",
		detectChangesGlob: "*.txt",
		detectChanges: () => [],
		applyChanges: async ({ changes }) => {
			// Apply the changes and create a simple representation of the file
			// Each line shows which entity was modified by which change
			const appliedChanges = changes.map(
				(change) => `row:${change.entity_id}=${change.id}`
			);

			return {
				fileData: new TextEncoder().encode(appliedChanges.join("\n")),
			};
		},
	};

	const lix = await openLixInMemory({
		providePlugins: [mockPlugin],
	});

	// Create a test file (use non-fallback path)
	await lix.db
		.insertInto("file")
		.values({
			id: "recursive-test-file",
			data: new TextEncoder().encode(""),
			path: "/recursive-test.txt",
		})
		.execute();

	const file = await lix.db
		.selectFrom("file")
		.where("id", "=", "recursive-test-file")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Create a snapshot for our changes
	const snapshot = await createSnapshot({
		lix,
		content: { value: "test-content" },
	});

	// Create three changes with timestamps in order
	const baseDate = new Date("2023-01-01T00:00:00Z");

	// Change 1 (oldest) - modifies row1
	await lix.db
		.insertInto("change")
		.values({
			id: "recursive-change1",
			file_id: file.id,
			plugin_key: mockPlugin.key,
			snapshot_id: snapshot.id,
			entity_id: "row1", // First row
			schema_key: "lix_key_value",
			schema_version: "1.0",
			created_at: new Date(baseDate.getTime()).toISOString(),
		})
		.execute();

	const change1 = await lix.db
		.selectFrom("change")
		.where("id", "=", "recursive-change1")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Change 2 (middle) - also modifies row1, should supersede change1
	await lix.db
		.insertInto("change")
		.values({
			id: "recursive-change2",
			file_id: file.id,
			plugin_key: mockPlugin.key,
			snapshot_id: snapshot.id,
			entity_id: "row1", // Same row as change1
			schema_key: "lix_key_value",
			schema_version: "1.0",
			created_at: new Date(baseDate.getTime() + 1000).toISOString(),
		})
		.execute();

	const change2 = await lix.db
		.selectFrom("change")
		.where("id", "=", "recursive-change2")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Change 3 (newest) - modifies row2
	await lix.db
		.insertInto("change")
		.values({
			id: "recursive-change3",
			file_id: file.id,
			plugin_key: mockPlugin.key,
			snapshot_id: snapshot.id,
			entity_id: "row2", // Different row
			schema_key: "lix_key_value",
			schema_version: "1.0",
			created_at: new Date(baseDate.getTime() + 2000).toISOString(),
		})
		.execute();

	const change3 = await lix.db
		.selectFrom("change")
		.where("id", "=", "recursive-change3")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Create change sets with parent-child relationships:
	// changeSet1 (oldest) <- changeSet2 (middle) <- changeSet3 (newest/leaf)
	const changeSet1 = await createChangeSet({
		lix,
		elements: [
			{
				change_id: change1.id,
				entity_id: change1.entity_id,
				schema_key: change1.schema_key,
				file_id: change1.file_id,
			},
		],
	});

	const changeSet2 = await createChangeSet({
		lix,
		elements: [
			{
				change_id: change2.id,
				entity_id: change2.entity_id,
				schema_key: change2.schema_key,
				file_id: change2.file_id,
			},
		],
		parents: [changeSet1],
	});

	const changeSet3 = await createChangeSet({
		lix,
		elements: [
			{
				change_id: change3.id,
				entity_id: change3.entity_id,
				schema_key: change3.schema_key,
				file_id: change3.file_id,
			},
		],
		parents: [changeSet2],
	});

	// Apply changes recursively (default behavior)
	await applyChangeSet({
		lix,
		changeSet: changeSet3,
	});

	// Verify all leaf changes were applied in recursive mode
	const updatedFile = await lix.db
		.selectFrom("file")
		.where("id", "=", file.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	// The result should contain:
	// - row1=change2 (not change1, since change2 is newer for the same entity)
	// - row2=change3
	// The order of rows might vary, so we'll split and sort
	const resultRows = new TextDecoder()
		.decode(updatedFile.data)
		.split("\n")
		.sort();
	expect(resultRows).toEqual(
		["row:row1=recursive-change2", "row:row2=recursive-change3"].sort()
	);
});
