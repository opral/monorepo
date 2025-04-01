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
		changes: [change0],
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
	const changeSet = await createChangeSet({ lix, changes: [change] });

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
	const changeSet = await createChangeSet({ lix, changes: [change] });

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
	const changeSet = await createChangeSet({ lix, changes: [change] });

	// Apply change set and verify error for unsupported applyChanges
	await expect(applyChangeSet({ lix, changeSet })).rejects.toThrow(
		`Plugin with key ${mockPlugin.key} does not support applying changes`
	);
});

test("applies an insert change from a change set if the file does not exist", async () => {
	// Plugin that creates/updates .txt files based on snapshot content
	const mockTxtPlugin: LixPlugin = {
		key: "mock_txt_plugin",
		detectChangesGlob: "*.txt",
		detectChanges: async ({ after }) => {
			return [
				{
					entity_id: "txt_file",
					snapshot: after
						? { text: new TextDecoder().decode(after.data) }
						: null,
					schema: { type: "json", key: "txt" },
				},
			];
		},
		applyChanges: async ({ lix, changes }) => {
			// applyChanges uses the latest change's snapshot
			const latestChange = changes
				.sort((a, b) => a.created_at.localeCompare(b.created_at))
				.at(-1);
			if (!latestChange) return { fileData: new Uint8Array() };

			const snapshot = await lix.db
				.selectFrom("snapshot")
				.where("id", "=", latestChange.snapshot_id)
				.selectAll()
				.executeTakeFirstOrThrow();

			return {
				fileData: new TextEncoder().encode(snapshot.content!.text),
			};
		},
	};

	// --- Setup lix 1 with the file and generate the initial change/changeSet ---
	const lix1 = await openLixInMemory({
		providePlugins: [mockTxtPlugin],
	});

	// Insert the initial file
	await lix1.db
		.insertInto("file")
		.values({
			path: "/test.txt",
			data: new TextEncoder().encode("hello initial"),
		})
		.executeTakeFirstOrThrow();

	// Wait for detectChanges to run and create the change
	await fileQueueSettled({ lix: lix1 });

	// Get the created change and its snapshot
	const changesInLix1 = await lix1.db
		.selectFrom("change")
		.selectAll()
		.execute();

	const snapshotsInLix1 = await lix1.db
		.selectFrom("snapshot")
		.selectAll()
		.execute();

	// Create a change set in lix1
	const changeSetInLix1 = await createChangeSet({
		lix: lix1,
		changes: changesInLix1,
	});

	// --- Setup lix 2 (empty) and apply the change set from lix1 ---
	const lix2 = await openLixInMemory({
		providePlugins: [mockTxtPlugin],
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
	await lix2.db.insertInto("change").values(changesInLix1).execute();

	// 3. ChangeSet
	await lix2.db.insertInto("change_set").values(changeSetInLix1).execute();

	// 4. ChangeSetElement
	await lix2.db
		.insertInto("change_set_element")
		.values(
			changesInLix1.map((c) => ({
				change_id: c.id,
				change_set_id: changeSetInLix1.id,
				// Copy required fields from the change itself
				entity_id: c.entity_id,
				file_id: c.file_id,
				schema_key: c.schema_key,
			}))
		)
		.execute();

	// Apply the changeSet in lix2
	await applyChangeSet({ lix: lix2, changeSet: changeSetInLix1 });

	// --- Verification ---
	// Check if the file was created in lix2
	const fileInLix2 = await lix2.db
		.selectFrom("file")
		.where("path", "=", "/test.txt")
		.selectAll()
		.executeTakeFirst();

	expect(fileInLix2).toBeDefined();
	expect(new TextDecoder().decode(fileInLix2!.data)).toBe("hello initial");
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

	const changeSet = await createChangeSet({ lix, changes: changesBefore });

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

test("mode: recursive applies changes from target and all ancestors while direct only applies the target", async () => {
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
			id: "change1",
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
			id: "change2",
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
			id: "change3",
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
		changes: [change1],
	});

	const changeSet2 = await createChangeSet({
		lix,
		changes: [change2],
		parents: [changeSet1],
	});

	const changeSet3 = await createChangeSet({
		lix,
		changes: [change3],
		parents: [changeSet2],
	});

	// Test 1: Direct mode should only apply changes from the target change set
	await applyChangeSet({
		lix,
		changeSet: changeSet3,
		mode: { type: "direct" },
	});

	// Verify only change3 (row2) was applied in direct mode
	let updatedFile = await lix.db
		.selectFrom("file")
		.where("id", "=", file.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(new TextDecoder().decode(updatedFile.data)).toBe("row:row2=change3");

	// Reset the file data
	await lix.db
		.updateTable("file")
		.set({ data: new TextEncoder().encode("") })
		.where("id", "=", file.id)
		.execute();

	// Test 2: Recursive mode should apply leaf changes from the target and all ancestors
	await applyChangeSet({
		lix,
		changeSet: changeSet3,
		mode: { type: "recursive" },
	});

	// Verify all leaf changes were applied in recursive mode
	updatedFile = await lix.db
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
	expect(resultRows).toEqual(["row:row1=change2", "row:row2=change3"].sort());
});
