import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { restoreChangeSet } from "./restore-change-set.js";
import type { LixPlugin } from "../plugin/lix-plugin.js";
import { createSnapshot } from "../snapshot/create-snapshot.js";
import { createChangeSet } from "./create-change-set.js";
import { applyChangeSet } from "./apply-change-set.js";

test("it restores the state to a specific change set", async () => {
	// Create a mock plugin that handles text file lines
	const mockPlugin: LixPlugin = {
		key: "mock_plugin",
		applyChanges: async ({ lix, changes }) => {
			const withSnapshots = await Promise.all(
				changes.map(async (change) => {
					return await lix.db
						.selectFrom("snapshot")
						.innerJoin("change", "change.snapshot_id", "snapshot.id")
						.where("change.id", "=", change.id)
						.selectAll("change")
						.select("snapshot.content as content")
						.executeTakeFirstOrThrow();
				})
			);
			const sorted = withSnapshots.sort((a, b) =>
				a.entity_id.localeCompare(b.entity_id)
			);
			const lines = sorted.map((s) => s.content?.text ?? "").join("\n");
			return {
				fileData: new TextEncoder().encode(lines),
			};
		},
	};

	// Create a Lix instance with our plugin
	const lix = await openLixInMemory({
		providePlugins: [mockPlugin],
	});

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select(["id"])
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

	// Create snapshots for the changes
	const snapshot0 = await createSnapshot({ lix, content: { text: "Line 0" } });
	const snapshot1 = await createSnapshot({ lix, content: { text: "Line 1" } });
	const snapshot2 = await createSnapshot({ lix, content: { text: "Line 2" } });
	const snapshot3 = await createSnapshot({
		lix,
		content: { text: "Line 2 Modified" },
	});

	// Create three changes (c0, c1, c2)
	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "c0",
				file_id: file.id,
				plugin_key: mockPlugin.key,
				entity_id: "l0",
				schema_key: "line",
				snapshot_id: snapshot0.id,
			},
			{
				id: "c1",
				file_id: file.id,
				plugin_key: mockPlugin.key,
				entity_id: "l1",
				schema_key: "line",
				snapshot_id: snapshot1.id,
			},
			{
				id: "c2",
				file_id: file.id,
				plugin_key: mockPlugin.key,
				entity_id: "l2",
				schema_key: "line",
				snapshot_id: snapshot2.id,
			},
			{
				id: "c3",
				file_id: file.id,
				plugin_key: mockPlugin.key,
				entity_id: "l2",
				schema_key: "line",
				snapshot_id: snapshot3.id,
			},
		])
		.returningAll()
		.execute();

	// Create change set 1 with changes c0, c1, c2
	const cs0 = await createChangeSet({
		lix,
		changes: [changes[0]!, changes[1]!, changes[2]!],
	});

	// Create change set 2 with change c3
	const cs1 = await createChangeSet({
		lix,
		changes: [changes[3]!],
		parents: [cs0],
	});

	await applyChangeSet({
		lix,
		changeSet: cs1,
	});

	// Verify initial state
	const initialFile = await lix.db
		.selectFrom("file")
		.where("id", "=", file.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(new TextDecoder().decode(initialFile.data)).toBe(
		"Line 0\nLine 1\nLine 2 Modified"
	);

	// Action: Restore to cs0
	await restoreChangeSet({
		lix,
		changeSet: { id: cs0.id },
		version: activeVersion,
	});

	// Verify final state
	// 1. Check if version points to cs1
	const finalVersion = await lix.db
		.selectFrom("version_v2")
		.where("id", "=", activeVersion.id)
		.select(["change_set_id"])
		.executeTakeFirstOrThrow();

	expect(finalVersion.change_set_id).toBe(cs0.id);

	// 2. Check file content reflects cs0 state
	const finalFile = await lix.db
		.selectFrom("file")
		.where("id", "=", file.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(new TextDecoder().decode(finalFile.data)).toBe(
		"Line 0\nLine 1\nLine 2"
	);
});
