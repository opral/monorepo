import { test, expect, vi } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { mockJsonSnapshot } from "../snapshot/mock-json-snapshot.js";
import type { NewKeyValue } from "../key-value/database-schema.js";
import { applyChangeSet } from "./apply-change-set.js";
import { createChangeSet } from "./create-change-set.js";
import { createSnapshot } from "../snapshot/create-snapshot.js";
import type { LixPlugin } from "../plugin/lix-plugin.js";
import { fileQueueSettled } from "../file-queue/index.js";
import { withSkipOwnChangeControl } from "../own-change-control/with-skip-own-change-control.js";
import { mockChange } from "../change/mock-change.js";
import { changeSetIsAncestorOf } from "../query-filter/change-set-is-ancestor-of.js";
import { mockJsonPlugin } from "../plugin/mock-json-plugin.js";
import { changeSetElementIsLeafOf } from "../query-filter/change-set-element-is-leaf-of.js";

test("it applies own entity changes", async () => {
	const lix = await openLixInMemory({});

	const keyValueBefore = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "mock-key")
		.selectAll()
		.executeTakeFirst();

	expect(keyValueBefore).toBeUndefined();

	const snapshot = mockJsonSnapshot({
		key: "mock-key",
		value: "1+1=2",
	} satisfies NewKeyValue);

	await lix.db
		.insertInto("snapshot")
		.values({
			content: snapshot.content,
		})
		.execute();

	const change0 = await lix.db
		.insertInto("change")
		.values({
			id: "change0",
			entity_id: "mock-key",
			file_id: "lix_own_change_control",
			plugin_key: "lix_own_change_control",
			schema_key: "lix_key_value_table",
			snapshot_id: snapshot.id,
			created_at: "2021-01-01T00:00:00Z",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	const changeSet0 = await createChangeSet({
		lix,
		elements: [
			{
				change_id: change0.id,
				entity_id: change0.entity_id,
				schema_key: change0.schema_key,
				file_id: change0.file_id,
			},
		],
	});

	await applyChangeSet({
		lix,
		changeSet: changeSet0,
	});

	const keyValueAfter = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "mock-key")
		.selectAll()
		.executeTakeFirst();

	expect(keyValueAfter).toMatchObject({
		key: "mock-key",
		value: "1+1=2",
	});
});

test("it applies the changes associated with the change set", async () => {
	const mockPlugin: LixPlugin = {
		key: "plugin1",
		applyChanges: vi.fn(async ({ changes, file }) => {
			// Mock plugin simply appends changeId to file data
			const currentData = file.data ? new TextDecoder().decode(file.data) : "";
			return {
				fileData: new TextEncoder().encode(
					`${currentData} updated-by-${changes[0]?.id}`
				),
			};
		}),
	};

	const lix = await openLixInMemory({
		providePlugins: [mockPlugin],
	});

	// Insert a file
	const file = await lix.db
		.insertInto("file")
		.values({
			id: "file1",
			data: new TextEncoder().encode("initial-data"),
			path: "/mock-path",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	// Create a snapshot (content doesn't matter much for this mock)
	const snapshot = await createSnapshot({ lix, content: { value: "mock" } });

	// Insert a change linked to the mock plugin and snapshot
	const change = await lix.db
		.insertInto("change")
		.values({
			id: "changeA",
			file_id: file.id,
			plugin_key: mockPlugin.key,
			snapshot_id: snapshot.id,
			entity_id: "entity1", // required but arbitrary for this test
			schema_key: "mockSchema", // required but arbitrary for this test
			created_at: new Date().toISOString(), // required
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	// Create a change set containing the change
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

	// Apply the change set
	await applyChangeSet({ lix, changeSet });

	// Verify file data was updated by the mock plugin via applyChangeSet
	const updatedFile = await lix.db
		.selectFrom("file")
		.where("id", "=", "file1")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Check that the mock plugin logic was applied
	expect(new TextDecoder().decode(updatedFile.data)).toBe(
		"initial-data updated-by-changeA"
	);

	// Verify the mock plugin's applyChanges was called
	expect(mockPlugin.applyChanges).toHaveBeenCalledOnce();
});

test("throws an error if plugin does not exist", async () => {
	const lix = await openLixInMemory({});

	// Insert a file
	const file = await lix.db
		.insertInto("file")
		.values({
			id: "file1",
			data: new TextEncoder().encode("initial-data"),
			path: "/mock-path",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	// Create a snapshot
	const snapshot = await createSnapshot({ lix, content: { value: "test" } });

	// Insert a change linked to a non-existent plugin
	const change = await lix.db
		.insertInto("change")
		.values({
			id: "changeB",
			file_id: file.id,
			plugin_key: "non-existent-plugin",
			snapshot_id: snapshot.id,
			entity_id: "entity2",
			schema_key: "mockSchema",
			created_at: new Date().toISOString(),
		})
		.returningAll()
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
	const file = await lix.db
		.insertInto("file")
		.values({
			id: "file2",
			data: new TextEncoder().encode("initial-data-2"),
			path: "/mock-path-2",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	// Create a snapshot
	const snapshot = await createSnapshot({ lix, content: { value: "test2" } });

	// Insert a change linked to the mock plugin
	const change = await lix.db
		.insertInto("change")
		.values({
			id: "changeC",
			file_id: file.id,
			plugin_key: mockPlugin.key,
			snapshot_id: snapshot.id,
			entity_id: "entity3",
			schema_key: "mockSchema",
			created_at: new Date().toISOString(),
		})
		.returningAll()
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

test("applies an insert change from a change set even if the file does not exist", async () => {
	const lix1 = await openLixInMemory({
		providePlugins: [mockJsonPlugin],
	});

	// Insert the initial file
	await lix1.db
		.insertInto("file")
		.values({
			path: "/test.json",
			data: new TextEncoder().encode(JSON.stringify({ value: "hello world" })),
		})
		.executeTakeFirstOrThrow();

	// Wait for detectChanges to run and create the change
	await fileQueueSettled({ lix: lix1 });

	const activeVersionLix1 = await lix1.db
		.selectFrom("active_version")
		.innerJoin("version_v2", "active_version.version_id", "version_v2.id")
		.selectAll("version_v2")
		.executeTakeFirstOrThrow();

	// Get the created change and its snapshot
	const leafChangesInLix1 = await lix1.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change.id",
			"change_set_element.change_id"
		)
		.where(changeSetElementIsLeafOf([{ id: activeVersionLix1.change_set_id }]))
		.selectAll("change")
		.execute();

	const snapshotsInLix1 = await lix1.db
		.selectFrom("snapshot")
		.selectAll()
		.execute();

	// Create a change set in lix1
	const changeSetInLix1 = await createChangeSet({
		lix: lix1,
		elements: leafChangesInLix1.map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
	});

	// --- Setup lix 2 (empty) and apply the change set from lix1 ---
	const lix2 = await openLixInMemory({
		providePlugins: [mockJsonPlugin],
	});

	// Manually insert required records into lix2 for applyChangeSet to work
	// 1. Snapshot
	await lix2.db
		.insertInto("snapshot")
		.values(snapshotsInLix1.map((s) => ({ content: s.content })))
		.onConflict((oc) => oc.doNothing())
		.execute();

	// 2. Change
	// the changes need to exist too to avoid foreign key constraint errors
	// (applyChanges assumes that changes are existent in the lix)
	await lix2.db.insertInto("change").values(leafChangesInLix1).execute();

	// 3. ChangeSet
	await lix2.db
		.insertInto("change_set")
		.values({
			id: changeSetInLix1.id,
			// needs to be false because we are inserting elements below
			immutable_elements: false,
		})
		.execute();

	// 4. ChangeSetElement
	await lix2.db
		.insertInto("change_set_element")
		.values(
			leafChangesInLix1.map((c) => ({
				change_id: c.id,
				change_set_id: changeSetInLix1.id,
				// Copy required fields from the change itself
				entity_id: c.entity_id,
				file_id: c.file_id,
				schema_key: c.schema_key,
			}))
		)
		.execute();

	await lix2.db
		.updateTable("change_set")
		.set({
			immutable_elements: true,
		})
		.where("id", "=", changeSetInLix1.id)
		.execute();

	// Apply the changeSet in lix2
	await applyChangeSet({ lix: lix2, changeSet: changeSetInLix1 });

	// --- Verification ---
	// Check if the file was created in lix2
	const fileInLix2 = await lix2.db
		.selectFrom("file")
		.where("path", "=", "/test.json")
		.selectAll()
		.executeTakeFirst();

	expect(fileInLix2).toBeDefined();
	expect(new TextDecoder().decode(fileInLix2!.data)).toBe(
		JSON.stringify({ value: "hello world" })
	);
});

test("should not lead to new changes if called with withSkipOwnChangeControl", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("key_value")
		.values({ key: "test-key", value: "initial-value" })
		.execute();

	const changesBefore = await lix.db
		.selectFrom("change")
		.where("change.entity_id", "=", "test-key")
		.where("change.schema_key", "=", "lix_key_value_table")
		.selectAll()
		.execute();

	const changeSet = await createChangeSet({
		lix,
		elements: changesBefore.map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
	});

	// Delete the key-value record to test applying
	await withSkipOwnChangeControl(lix.db, async (trx) => {
		await trx.deleteFrom("key_value").where("key", "=", "test-key").execute();
	});

	// Apply the ChangeSet within a skipped transaction
	// which should recreate the key-value record
	await withSkipOwnChangeControl(lix.db, async (trx) => {
		await applyChangeSet({ lix: { ...lix, db: trx }, changeSet });
	});

	// 6. Verify the change was applied
	const afterKeyValue = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "test-key")
		.selectAll()
		.executeTakeFirst();

	const changesAfter = await lix.db
		.selectFrom("change")
		.where("change.entity_id", "=", "test-key")
		.where("change.schema_key", "=", "lix_key_value_table")
		.selectAll()
		.execute();

	expect(afterKeyValue?.value).toBe("initial-value");
	expect(changesAfter).toEqual(changesBefore);
});

test("mode: direct only applies changes from the target change set", async () => {
	// Create a mock plugin that simulates a document with multiple rows
	// Each change will modify a specific row identified by entity_id
	const mockPlugin: LixPlugin = {
		key: "direct-test-plugin",
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

	// Create a test file
	const file = await lix.db
		.insertInto("file")
		.values({
			id: "direct-test-file",
			data: new TextEncoder().encode(""),
			path: "/direct-test-path",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	// Create a snapshot for our changes
	const snapshot = await createSnapshot({
		lix,
		content: { value: "test-content" },
	});

	// Create three changes with timestamps in order
	const baseDate = new Date("2023-01-01T00:00:00Z");

	// Change 1 (oldest) - modifies row1
	const change1 = await lix.db
		.insertInto("change")
		.values({
			id: "direct-change1",
			file_id: file.id,
			plugin_key: mockPlugin.key,
			snapshot_id: snapshot.id,
			entity_id: "row1", // First row
			schema_key: "testSchema",
			created_at: new Date(baseDate.getTime()).toISOString(),
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	// Change 2 (middle) - also modifies row1, should supersede change1
	const change2 = await lix.db
		.insertInto("change")
		.values({
			id: "direct-change2",
			file_id: file.id,
			plugin_key: mockPlugin.key,
			snapshot_id: snapshot.id,
			entity_id: "row1", // Same row as change1
			schema_key: "testSchema",
			created_at: new Date(baseDate.getTime() + 1000).toISOString(),
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	// Change 3 (newest) - modifies row2
	const change3 = await lix.db
		.insertInto("change")
		.values({
			id: "direct-change3",
			file_id: file.id,
			plugin_key: mockPlugin.key,
			snapshot_id: snapshot.id,
			entity_id: "row2", // Different row
			schema_key: "testSchema",
			created_at: new Date(baseDate.getTime() + 2000).toISOString(),
		})
		.returningAll()
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

	// Direct mode should only apply changes from the target change set
	await applyChangeSet({
		lix,
		changeSet: changeSet3,
		mode: { type: "direct" },
	});

	// Verify only change3 (row2) was applied in direct mode
	const updatedFile = await lix.db
		.selectFrom("file")
		.where("id", "=", file.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(new TextDecoder().decode(updatedFile.data)).toBe(
		"row:row2=direct-change3"
	);
});

test("mode: recursive applies changes from target and all ancestors", async () => {
	// Create a mock plugin that simulates a document with multiple rows
	// Each change will modify a specific row identified by entity_id
	const mockPlugin: LixPlugin = {
		key: "recursive-test-plugin",
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

	// Create a test file
	const file = await lix.db
		.insertInto("file")
		.values({
			id: "recursive-test-file",
			data: new TextEncoder().encode(""),
			path: "/recursive-test-path",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	// Create a snapshot for our changes
	const snapshot = await createSnapshot({
		lix,
		content: { value: "test-content" },
	});

	// Create three changes with timestamps in order
	const baseDate = new Date("2023-01-01T00:00:00Z");

	// Change 1 (oldest) - modifies row1
	const change1 = await lix.db
		.insertInto("change")
		.values({
			id: "recursive-change1",
			file_id: file.id,
			plugin_key: mockPlugin.key,
			snapshot_id: snapshot.id,
			entity_id: "row1", // First row
			schema_key: "testSchema",
			created_at: new Date(baseDate.getTime()).toISOString(),
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	// Change 2 (middle) - also modifies row1, should supersede change1
	const change2 = await lix.db
		.insertInto("change")
		.values({
			id: "recursive-change2",
			file_id: file.id,
			plugin_key: mockPlugin.key,
			snapshot_id: snapshot.id,
			entity_id: "row1", // Same row as change1
			schema_key: "testSchema",
			created_at: new Date(baseDate.getTime() + 1000).toISOString(),
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	// Change 3 (newest) - modifies row2
	const change3 = await lix.db
		.insertInto("change")
		.values({
			id: "recursive-change3",
			file_id: file.id,
			plugin_key: mockPlugin.key,
			snapshot_id: snapshot.id,
			entity_id: "row2", // Different row
			schema_key: "testSchema",
			created_at: new Date(baseDate.getTime() + 2000).toISOString(),
		})
		.returningAll()
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

	// Recursive mode should apply leaf changes from the target and all ancestors
	await applyChangeSet({
		lix,
		changeSet: changeSet3,
		mode: { type: "recursive" },
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

test("updates the version's change set id and maintains ancestry relationship", async () => {
	// Create a simple mock plugin
	const mockPlugin: LixPlugin = {
		key: "test",
		applyChanges: async () => {
			// Simple implementation that just returns a new Uint8Array
			return { fileData: new Uint8Array() };
		},
	};

	// Create a test Lix instance with the mock plugin
	const lix = await openLixInMemory({
		providePlugins: [mockPlugin],
	});

	// Get the active version and its initial change set
	const initialVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version_v2", "version_v2.id", "active_version.version_id")
		.selectAll("version_v2")
		.executeTakeFirstOrThrow();

	// Create a file for testing
	const file = await lix.db
		.insertInto("file")
		.values({
			id: "test-file",
			data: new Uint8Array(),
			path: "/test.json",
			metadata: null,
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	const changes = await lix.db
		.insertInto("change")
		.values([
			mockChange({ id: "c1", file_id: file.id, plugin_key: mockPlugin.key }),
		])
		.returningAll()
		.execute();

	// Create a new change set
	const newChangeSet = await createChangeSet({
		lix,
		elements: changes.map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		// specifically not providing parents
		parents: [],
	});

	// Apply the change set
	await applyChangeSet({
		lix,
		changeSet: newChangeSet,
	});

	// Verify the change set is now in the ancestry of the version
	const updatedVersion = await lix.db
		.selectFrom("version_v2")
		.where("id", "=", initialVersion.id)
		.selectAll("version_v2")
		.executeTakeFirstOrThrow();

	const ancestoryChangeSets = await lix.db
		.selectFrom("change_set")
		.where(
			changeSetIsAncestorOf(
				{ id: updatedVersion.change_set_id },
				{ includeSelf: true }
			)
		)
		.selectAll("change_set")
		.execute();

	expect(ancestoryChangeSets).toContainEqual(newChangeSet);
});
