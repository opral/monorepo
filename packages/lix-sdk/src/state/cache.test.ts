import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";

test("insert operations populate the cache, leading to fast subsequent select queries", async () => {
	const lix = await openLixInMemory({});

	// Get the active version to use in the test
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	// 1. Insert a state entry (this should trigger cache population via write-through)
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "test-entity",
			schema_key: "test-schema", 
			file_id: "test-file",
			plugin_key: "test-plugin",
			snapshot_content: { test: "data" },
			schema_version: "1.0",
			version_id: activeVersion.id,
		})
		.execute();

	// 2. Verify the cache table was populated during the insert
	const cacheEntry = await lix.db
		.selectFrom("internal_state_cache")
		.where("entity_id", "=", "test-entity")
		.where("schema_key", "=", "test-schema")
		.where("file_id", "=", "test-file")
		.where("version_id", "=", activeVersion.id)
		.selectAll()
		.executeTakeFirst();

	expect(cacheEntry).toBeDefined();
	expect(cacheEntry?.entity_id).toBe("test-entity");
	expect(cacheEntry?.plugin_key).toBe("test-plugin");
	expect(cacheEntry?.snapshot_content).toEqual({ test: "data" })

	// 3. Query state view and verify it returns the same data
	const stateResults = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "test-entity")
		.selectAll()
		.execute();

	expect(stateResults).toHaveLength(1);
	expect(stateResults[0]?.entity_id).toBe("test-entity");
	expect(stateResults[0]?.plugin_key).toBe("test-plugin");
});

test("update operations update the cache correctly", async () => {
	const lix = await openLixInMemory({});

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	// 1. Insert initial state
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "update-entity",
			schema_key: "update-schema",
			file_id: "update-file",
			plugin_key: "update-plugin",
			snapshot_content: { initial: "value" },
			schema_version: "1.0",
			version_id: activeVersion.id,
		})
		.execute();

	// 2. Update the state
	await lix.db
		.updateTable("state")
		.set({
			snapshot_content: { updated: "value" },
			plugin_key: "updated-plugin",
		})
		.where("entity_id", "=", "update-entity")
		.where("schema_key", "=", "update-schema")
		.where("file_id", "=", "update-file")
		.where("version_id", "=", activeVersion.id)
		.execute();

	// 3. Verify cache was updated
	const cacheEntry = await lix.db
		.selectFrom("internal_state_cache")
		.where("entity_id", "=", "update-entity")
		.where("schema_key", "=", "update-schema")
		.where("file_id", "=", "update-file")
		.where("version_id", "=", activeVersion.id)
		.selectAll()
		.executeTakeFirst();

	expect(cacheEntry).toBeDefined();
	expect(cacheEntry?.snapshot_content).toEqual({ updated: "value" });
	expect(cacheEntry?.plugin_key).toBe("updated-plugin");

	// 4. Verify state view returns updated data
	const stateResults = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "update-entity")
		.selectAll()
		.execute();

	expect(stateResults).toHaveLength(1);
	expect(stateResults[0]?.snapshot_content).toEqual({ updated: "value" });
	expect(stateResults[0]?.plugin_key).toBe("updated-plugin");
});

test("delete operations remove entries from cache", async () => {
	const lix = await openLixInMemory({});

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	// 1. Insert initial state
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "delete-entity",
			schema_key: "delete-schema",
			file_id: "delete-file",
			plugin_key: "delete-plugin",
			snapshot_content: { to: "delete" },
			schema_version: "1.0",
			version_id: activeVersion.id,
		})
		.execute();

	// Verify cache entry exists
	const cacheEntryBefore = await lix.db
		.selectFrom("internal_state_cache")
		.where("entity_id", "=", "delete-entity")
		.where("schema_key", "=", "delete-schema")
		.where("file_id", "=", "delete-file")
		.where("version_id", "=", activeVersion.id)
		.selectAll()
		.executeTakeFirst();

	expect(cacheEntryBefore).toBeDefined();

	// 2. Delete the state
	await lix.db
		.deleteFrom("state")
		.where("entity_id", "=", "delete-entity")
		.where("schema_key", "=", "delete-schema")
		.where("file_id", "=", "delete-file")
		.where("version_id", "=", activeVersion.id)
		.execute();

	// 3. Verify cache entry was removed
	const cacheEntryAfter = await lix.db
		.selectFrom("internal_state_cache")
		.where("entity_id", "=", "delete-entity")
		.where("schema_key", "=", "delete-schema")
		.where("file_id", "=", "delete-file")
		.where("version_id", "=", activeVersion.id)
		.selectAll()
		.executeTakeFirst();

	expect(cacheEntryAfter).toBeUndefined();

	// 4. Verify state view no longer returns the data
	const stateResults = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "delete-entity")
		.selectAll()
		.execute();

	expect(stateResults).toHaveLength(0);
});