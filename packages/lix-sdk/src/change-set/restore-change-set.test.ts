import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { restoreChangeSet } from "./restore-change-set.js";
import type { LixPlugin } from "../plugin/lix-plugin.js";
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

	const snapshots = await lix.db
		.insertInto("snapshot")
		.values([
			{ content: { text: "Line 0" } },
			{ content: { text: "Line 1" } },
			{ content: { text: "Line 2" } },
			{ content: { text: "Line 2 Modified" } },
			{ content: { text: "Line 3" } },
		])
		.returningAll()
		.execute();

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "c0",
				file_id: file.id,
				plugin_key: mockPlugin.key,
				entity_id: "l0",
				schema_key: "line",
				snapshot_id: snapshots[0]!.id,
			},
			{
				id: "c1",
				file_id: file.id,
				plugin_key: mockPlugin.key,
				entity_id: "l1",
				schema_key: "line",
				snapshot_id: snapshots[1]!.id,
			},
			{
				id: "c2",
				file_id: file.id,
				plugin_key: mockPlugin.key,
				entity_id: "l2",
				schema_key: "line",
				snapshot_id: snapshots[2]!.id,
			},
			{
				id: "c3",
				file_id: file.id,
				plugin_key: mockPlugin.key,
				entity_id: "l2",
				schema_key: "line",
				snapshot_id: snapshots[3]!.id,
			},
			{
				id: "c4",
				file_id: file.id,
				plugin_key: mockPlugin.key,
				entity_id: "l3",
				schema_key: "line",
				snapshot_id: snapshots[4]!.id,
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
		changes: [changes[4]!],
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

	const fileCs0BeforeTxt = new TextDecoder().decode(fileCs0Before.data);

	expect(fileCs0BeforeTxt).toBe("Line 0\nLine 1\nLine 2");

	await applyChangeSet({
		lix,
		changeSet: cs2,
	});

	// Verify initial state
	const fileCs2 = await lix.db
		.selectFrom("file")
		.where("id", "=", file.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(new TextDecoder().decode(fileCs2.data)).toBe(
		"Line 0\nLine 1\nLine 2 Modified\nLine 3"
	);

	// Action: Restore to cs0
	await restoreChangeSet({
		lix,
		changeSet: cs0,
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

	// 2. Check if data is updated
	const finalFile = await lix.db
		.selectFrom("file")
		.where("id", "=", file.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(new TextDecoder().decode(finalFile.data)).toBe(
		"Line 0\nLine 1\nLine 2"
	);
});