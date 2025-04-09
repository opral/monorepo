import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { experimentalRestoreChangeSet } from "./restore-change-set.js";
import type { LixPlugin } from "../plugin/lix-plugin.js";
import { createChangeSet } from "./create-change-set.js";
import { applyChangeSet } from "./apply-change-set.js";

test.todo("it restores the state to a specific change set", async () => {
	// Create a mock plugin that handles JSON data (entity_id -> snapshot content)
	const mockPlugin: LixPlugin = {
		key: "mock_plugin",
		applyChanges: async ({ lix, file, changes }) => {
			// Get the current state from the file data
			let currentJsonState: Record<string, any> = {};
			// Check if file.data exists and is not empty before parsing
			// Note: applyChanges is called *after* the file record is updated by restoreChangeSet,
			// so file.data should already reflect the restored state.
			// We expect the content to be an object like { text: "..." }
			if (file.data && file.data.length > 0) {
				try {
					currentJsonState = JSON.parse(new TextDecoder().decode(file.data));
				} catch (error) {
					// Handle potential parsing errors if the initial file data isn't valid JSON
					console.error("Failed to parse existing file data:", error);
					// Depending on the desired behavior, you might want to throw or start fresh
					currentJsonState = {};
				}
			}

			const withSnapshots = await Promise.all(
				changes.map(async (change) => {
					return await lix.db
						.selectFrom("change")
						.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
						.where("change.id", "=", change.id)
						.select(["change.id", "change.entity_id", "snapshot.content"])
						.executeTakeFirstOrThrow();
				})
			);

			// Build a JSON object mapping entity_id to snapshot content
			for (const change of withSnapshots) {
				if (change.content === null) {
					// If the content is null, remove the entity from the state
					delete currentJsonState[change.entity_id];
				} else {
					// Update the current state with the new change content
					// Need to decode the BLOB content from the snapshot
					// The plugin should handle deserializing the object stored in the BLOB
					currentJsonState[change.entity_id] = change.content;
				}
			}

			return {
				fileData: new TextEncoder().encode(JSON.stringify(currentJsonState)),
			};
		},
	};

	// Create a Lix instance with our plugin
	const lix = await openLixInMemory({
		providePlugins: [mockPlugin],
	});

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version_v2", "version_v2.id", "active_version.version_id")
		.selectAll("version_v2")
		.executeTakeFirstOrThrow();

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
			{ content: { text: "Value 0" } },
			{ content: { text: "Value 1" } },
			{ content: { text: "Value 2" } },
			{ content: { text: "Value 2 Modified" } }, // For c3
			{ content: { text: "Value 3" } }, // For c4
			{ content: { text: "Value 4" } }, // For c5
		])
		.returning("id")
		.execute();

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "c0",
				file_id: file.id,
				plugin_key: mockPlugin.key,
				entity_id: "l0",
				schema_key: "test_schema",
				snapshot_id: snapshots[0]!.id,
			},
			{
				id: "c1",
				file_id: file.id,
				plugin_key: mockPlugin.key,
				entity_id: "l1",
				schema_key: "test_schema",
				snapshot_id: snapshots[1]!.id,
			},
			{
				id: "c2",
				file_id: file.id,
				plugin_key: mockPlugin.key,
				entity_id: "l2",
				schema_key: "test_schema",
				snapshot_id: snapshots[2]!.id,
			},
			{
				id: "c3",
				file_id: file.id,
				plugin_key: mockPlugin.key,
				entity_id: "l2",
				schema_key: "test_schema",
				snapshot_id: snapshots[3]!.id,
			},
			{
				id: "c4",
				file_id: file.id,
				plugin_key: mockPlugin.key,
				entity_id: "l3",
				schema_key: "test_schema",
				snapshot_id: snapshots[4]!.id,
			},
			{
				id: "c5", // Add another change/entity for complexity
				entity_id: "l4",
				file_id: "file1",
				schema_key: "test_schema",
				plugin_key: "mock_plugin",
				snapshot_id: snapshots[5]!.id,
			},
		])
		.returningAll()
		.execute();

	const cs0 = await createChangeSet({
		lix,
		id: "cs0",
		changes: [changes[0]!, changes[1]!, changes[2]!],
	});

	const cs1 = await createChangeSet({
		lix,
		id: "cs1",
		changes: [changes[3]!],
		parents: [cs0],
	});

	const cs2 = await createChangeSet({
		lix,
		id: "cs2",
		changes: [changes[4]!, changes[5]!],
		parents: [cs1],
	});

	await applyChangeSet({
		lix,
		changeSet: cs0,
	});

	const fileCs0Before = await lix.db
		.selectFrom("file")
		.where("id", "=", file.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	// The file data should now be a JSON string representing the state at cs0
	const expectedJsonStateCs0 = {
		l0: { text: "Value 0" },
		l1: { text: "Value 1" },
		l2: { text: "Value 2" },
	};

	const actualJsonStateCs0 = JSON.parse(
		new TextDecoder().decode(fileCs0Before.data)
	);

	expect(actualJsonStateCs0).toEqual(expectedJsonStateCs0);

	await applyChangeSet({
		lix,
		changeSet: cs2,
	});

	// Verify initial state
	const fileAfterRestoreCs2 = await lix.db
		.selectFrom("file")
		.where("id", "=", file.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	// The file data should now be a JSON string representing the state at cs2
	const expectedJsonStateCs2 = {
		l0: { text: "Value 0" },
		l1: { text: "Value 1" },
		l2: { text: "Value 2 Modified" }, // c3 replaced c2
		l3: { text: "Value 3" }, // c4 added
		l4: { text: "Value 4" }, // c5 added
	};

	const actualJsonStateCs2 = JSON.parse(
		new TextDecoder().decode(fileAfterRestoreCs2.data)
	);

	expect(actualJsonStateCs2).toEqual(expectedJsonStateCs2);

	// Action: Restore to cs0
	await experimentalRestoreChangeSet({
		lix,
		changeSet: cs0,
		version: activeVersion,
	});

	// Verify final state
	// 1. Check that versions change set parent is cs2
	const finalVersion = await lix.db
		.selectFrom("version_v2")
		.where("id", "=", activeVersion.id)
		.select(["change_set_id"])
		.executeTakeFirstOrThrow();

	const parentCs = await lix.db
		.selectFrom("change_set_edge")
		.where("child_id", "=", finalVersion.change_set_id)
		.select(["parent_id"])
		.executeTakeFirstOrThrow();

	expect(parentCs.parent_id).toBe(cs2.id);

	// 2. Check if data is updated
	const finalFile = await lix.db
		.selectFrom("file")
		.where("id", "=", file.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	// The file data should now be a JSON string representing the state at cs0
	const actualJsonState = JSON.parse(new TextDecoder().decode(finalFile.data));

	expect(actualJsonState).toEqual(expectedJsonStateCs0);
});
