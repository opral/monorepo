import { expect, test, vi } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { applyChanges } from "./apply-changes.js";
import type { LixPlugin } from "../plugin/lix-plugin.js";
import { mockJsonSnapshot } from "../snapshot/mock-json-snapshot.js";
import type { NewKeyValue } from "../key-value/database-schema.js";
import { fileQueueSettled } from "../file-queue/file-queue-settled.js";

test("it applies the given changes", async () => {
	const lix = await openLixInMemory({});

	// Prepare mock plugin
	const mockPlugin: LixPlugin = {
		key: "plugin1",
		applyChanges: vi.fn(async ({ changes }) => {
			return {
				fileData: new TextEncoder().encode(`updated-data-${changes[0]?.id}`),
			};
		}),
	};

	vi.spyOn(lix.plugin, "getAll").mockResolvedValue([mockPlugin]);

	// Insert a file and changes, marking only one as a leaf
	const file = await lix.db
		.insertInto("file")
		.values({
			id: "file1",
			data: new TextEncoder().encode("initial-data"),
			path: "/mock-path",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "changeA",
				file_id: file.id,
				plugin_key: mockPlugin.key,
				snapshot_id: "no-content",
				entity_id: "value1",
				schema_key: "mock",
			},
		])
		.returningAll()
		.execute();

	await applyChanges({ lix, changes });

	// Verify file data was updated
	const updatedFile = await lix.db
		.selectFrom("file")
		.where("id", "=", "file1")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(new TextDecoder().decode(updatedFile.data)).toBe(
		"updated-data-changeA"
	);
});

test("applyChanges throws an error if plugin does not exist", async () => {
	const lix = await openLixInMemory({});

	const file = await lix.db
		.insertInto("file")
		.values({
			id: "file1",
			data: new TextEncoder().encode("initial-data"),
			path: "/mock-path",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "changeA",
				file_id: file.id,
				plugin_key: "non-existent",
				snapshot_id: "no-content",
				entity_id: "value1",
				schema_key: "mock",
			},
		])
		.returningAll()
		.execute();

	// Apply changes and verify error for missing plugin
	expect(applyChanges({ lix, changes })).rejects.toThrow(
		"Plugin with key non-existent not found"
	);
});

test("applyChanges throws an error if plugin does not support applying changes", async () => {
	const lix = await openLixInMemory({});

	// mock plugin has no applyChanges function
	const mockPlugin = { key: "plugin1" };

	vi.spyOn(lix.plugin, "getAll").mockResolvedValue([mockPlugin]);

	const file = await lix.db
		.insertInto("file")
		.values({
			id: "file1",
			data: new TextEncoder().encode("initial-data"),
			path: "/mock-path",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "changeA",
				file_id: file.id,
				plugin_key: mockPlugin.key,
				snapshot_id: "no-content",
				entity_id: "value1",
				schema_key: "mock",
			},
		])
		.returningAll()
		.execute();

	// Apply changes and verify error for unsupported applyChanges
	expect(applyChanges({ lix, changes })).rejects.toThrow(
		"Plugin with key plugin1 does not support applying changes"
	);
});

test("it applies own entity changes", async () => {
	const lix = await openLixInMemory({});

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

	await applyChanges({
		lix,
		changes: [
			{
				id: "change0",
				entity_id: "mock-key",
				file_id: "lix_own_change_control",
				plugin_key: "lix_own_change_control",
				schema_key: "lix_key_value_table",
				snapshot_id: snapshot.id,
				created_at: "2021-01-01T00:00:00Z",
			},
		],
	});

	const keyValue = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "mock-key")
		.selectAll()
		.executeTakeFirst();

	expect(keyValue).toMatchObject({
		key: "mock-key",
		value: "1+1=2",
	});
});

test("applies an insert change for a file if the file does not exist", async () => {
	const mockTxtPlugin: LixPlugin = {
		key: "mock_txt_plugin",
		detectChangesGlob: "*.txt",
		detectChanges: async ({ after }) => {
			return [
				{
					entity_id: "txt_file",
					snapshot: after
						? {
								text: new TextDecoder().decode(after?.data),
							}
						: null,
					schema: {
						type: "json",
						key: "txt",
					},
				},
			];
		},

		applyChanges: async ({ lix, changes }) => {
			const snapshot = await lix.db
				.selectFrom("snapshot")
				.where("id", "=", changes.at(-1)!.snapshot_id)
				.selectAll()
				.executeTakeFirstOrThrow();

			return {
				fileData: new TextEncoder().encode(snapshot.content!.text),
			};
		},
	};

	const lix = await openLixInMemory({
		providePlugins: [mockTxtPlugin],
	});

	// insertion change
	const file1 = await lix.db
		.insertInto("file")
		.values({
			path: "/test.txt",
			data: new TextEncoder().encode("hello"),
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	await fileQueueSettled({ lix });

	const changes1 = await lix.db
		.selectFrom("change")
		.orderBy("id desc")
		.selectAll()
		.execute();

	const snapshots1 = await lix.db.selectFrom("snapshot").selectAll().execute();

	const lix2 = await openLixInMemory({
		providePlugins: [mockTxtPlugin],
	});

	// the snapshots need to be in lix 2 to apply the changes
	await lix2.db
		.insertInto("snapshot")
		.values(snapshots1.map((c) => ({ content: c.content })))
		.onConflict((oc) => oc.doNothing())
		.execute();

	// the changes need to exist too to avoid foreign key constraint errors
	// (applyChanges assumes that changes are existent in the lix)
	await lix2.db.insertInto("change").values(changes1).execute();

	await applyChanges({ lix: lix2, changes: changes1 });

	const changes2 = await lix2.db
		.selectFrom("change")
		.orderBy("id desc")
		.selectAll()
		.execute();

	const file2 = await lix2.db
		.selectFrom("file")
		.where("path", "=", "/test.txt")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(changes1).toEqual(changes2);
	expect(file1).toEqual(file2);
});

test("it applies changes with skipFileQueue=false and detects changes", async () => {
	// Create a plugin that will modify the file content when changes are detected
	const mockPlugin: LixPlugin = {
		key: "plugin1",
		detectChangesGlob: "*.txt",
		detectChanges: async () => {
			// When detecting changes, create a new change with different content
			return [
				{
					entity_id: "detected_change",
					snapshot: {
						text: "detected-change-content",
					},
					schema: {
						type: "json",
						key: "txt",
					},
				},
			];
		},
		applyChanges: async ({ changes }) => {
			// When applying changes, use the snapshot content
			const changeId = changes[0]?.id || "unknown";
			return {
				fileData: new TextEncoder().encode(`applied-change-${changeId}`),
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
			id: "file1",
			data: new TextEncoder().encode("initial-data"),
			path: "/test.txt",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	// Create a change to apply
	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "changeA",
				file_id: file.id,
				plugin_key: mockPlugin.key,
				snapshot_id: "no-content",
				entity_id: "value1",
				schema_key: "mock",
			},
		])
		.returningAll()
		.execute();

	// Apply changes with skipFileQueue=false
	await applyChanges({
		lix,
		changes,
		skipFileQueue: false,
	});

	// Wait for the file queue to settle
	await fileQueueSettled({ lix });

	// Check if new changes were detected and created (since skipFileQueue=false)
	const detectedChanges = await lix.db
		.selectFrom("change")
		.where("entity_id", "=", "detected_change")
		.selectAll()
		.execute();

	// Should have detected changes
	expect(detectedChanges.length).toBeGreaterThan(0);

	// Apply changes with skipFileQueue=true (default)
	await applyChanges({
		lix,
		changes,
	});

	// Wait for the file queue to settle
	await fileQueueSettled({ lix });

	// Check if new changes were detected (should be none since skipFileQueue=true)
	const detectedChangesAfter = await lix.db
		.selectFrom("change")
		.where("entity_id", "=", "detected_change")
		.selectAll()
		.execute();

	// Should not have detected any new changes
	expect(detectedChangesAfter.length).toBe(detectedChanges.length);
});
