import { expect, test, vi } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { applyChanges } from "./apply-changes.js";
import type { LixPlugin } from "./lix-plugin.js";

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
			path: "mock-path",
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
		"updated-data-changeA",
	);
});

test("applyChanges throws an error if plugin does not exist", async () => {
	const lix = await openLixInMemory({});

	const file = await lix.db
		.insertInto("file")
		.values({
			id: "file1",
			data: new TextEncoder().encode("initial-data"),
			path: "mock-path",
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
		"Plugin with key non-existent not found",
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
			path: "mock-path",
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
		"Plugin with key plugin1 does not support applying changes",
	);
});
