import { describe, expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";

describe("change", () => {
	test("insert on the change view", async () => {
		const lix = await openLixInMemory({});

		// First create a snapshot that the change can reference
		await lix.db
			.insertInto("snapshot")
			.values({
				id: "snap1",
				content: { id: "entity1", name: "Test Entity" },
			})
			.execute();

		// Insert a change into the view
		await lix.db
			.insertInto("change")
			.values({
				id: "change1",
				entity_id: "entity1",
				schema_key: "test_schema",
				file_id: "file1",
				plugin_key: "test_plugin",
				snapshot_id: "snap1",
			})
			.execute();

		// Verify the change was inserted
		const viewAfterInsert = await lix.db
			.selectFrom("change")
			.where("id", "=", "change1")
			.selectAll()
			.execute();

		expect(viewAfterInsert).toHaveLength(1);
		expect(viewAfterInsert[0]).toMatchObject({
			id: "change1",
			entity_id: "entity1",
			schema_key: "test_schema",
			file_id: "file1",
			plugin_key: "test_plugin",
			snapshot_id: "snap1",
		});
		expect(viewAfterInsert[0]?.created_at).toBeDefined();

		// Verify it was also inserted into the internal_change table
		const internalChange = await lix.db
			// @ts-expect-error - internal change table
			.selectFrom("internal_change")
			.where("id", "=", "change1")
			.selectAll()
			.execute();

		expect(internalChange).toHaveLength(1);
		expect(internalChange[0]).toMatchObject({
			id: "change1",
			entity_id: "entity1",
			schema_key: "test_schema",
			file_id: "file1",
			plugin_key: "test_plugin",
			snapshot_id: "snap1",
		});
	});

	test("insert with default id generation", async () => {
		const lix = await openLixInMemory({});

		// First create a snapshot
		await lix.db
			.insertInto("snapshot")
			.values({
				id: "snap2",
				content: { id: "entity2" },
			})
			.execute();

		// Insert a change without specifying an id
		await lix.db
			.insertInto("change")
			.values({
				entity_id: "entity2",
				schema_key: "test_schema",
				file_id: "file2",
				plugin_key: "test_plugin",
				snapshot_id: "snap2",
			})
			.execute();

		// Verify a change was inserted with a generated ID
		const changes = await lix.db
			.selectFrom("change")
			.where("entity_id", "=", "entity2")
			.selectAll()
			.execute();

		expect(changes).toHaveLength(1);
		expect(changes[0]?.id).toBeDefined();
		expect(changes[0]?.id).not.toBe("");
		expect(changes[0]).toMatchObject({
			entity_id: "entity2",
			schema_key: "test_schema",
			file_id: "file2",
			plugin_key: "test_plugin",
			snapshot_id: "snap2",
		});
	});

	test("insert with default timestamp", async () => {
		const lix = await openLixInMemory({});

		// First create a snapshot
		await lix.db
			.insertInto("snapshot")
			.values({
				id: "snap3",
				content: { id: "entity3" },
			})
			.execute();

		// Insert a change without specifying created_at
		await lix.db
			.insertInto("change")
			.values({
				id: "change3",
				entity_id: "entity3",
				schema_key: "test_schema",
				file_id: "file3",
				plugin_key: "test_plugin",
				snapshot_id: "snap3",
			})
			.execute();

		// Verify the change has a timestamp
		const change = await lix.db
			.selectFrom("change")
			.where("id", "=", "change3")
			.selectAll()
			.execute();

		expect(change).toHaveLength(1);
		expect(change[0]?.created_at).toBeDefined();
		expect(change[0]?.created_at).not.toBe("");
	});

	test("insert fails with foreign key violation when snapshot does not exist", async () => {
		const lix = await openLixInMemory({});

		// Try to insert a change referencing a non-existent snapshot
		await expect(
			lix.db
				.insertInto("change")
				.values({
					id: "change_invalid",
					entity_id: "entity_invalid",
					schema_key: "test_schema",
					file_id: "file_invalid",
					plugin_key: "test_plugin",
					snapshot_id: "nonexistent_snapshot",
				})
				.execute()
		).rejects.toThrow(/FOREIGN KEY constraint failed/);
	});
});
