import { expect, test, vi } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { applyChanges } from "./apply-changes.js";
import type { LixPlugin } from "../plugin/lix-plugin.js";
import { mockJsonSnapshot } from "../snapshot/mock-json-snapshot.js";
import type { KeyValue } from "../key-value/database-schema.js";

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
	} satisfies KeyValue);

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
				file_id: "null",
				plugin_key: "lix_own_entity",
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

	expect(keyValue).toEqual({
		key: "mock-key",
		value: "1+1=2",
	});
});
