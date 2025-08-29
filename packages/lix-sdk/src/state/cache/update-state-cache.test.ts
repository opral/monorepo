import { test, expect } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { updateStateCache } from "./update-state-cache.js";
import { timestamp } from "../../deterministic/timestamp.js";
import { sql, type Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import type { MaterializedState } from "../vtable/generate-commit.js";
import type { InternalStateCache } from "./schema.js";

test("inserts into cache based on change", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, bootstrap: true },
			},
		],
	});

	const currentTimestamp = timestamp({ lix });

	// Create a test change (materialized with inline version/commit)
	const commitId = "test-commit-456";
	const versionId = "global";
	const testChange: MaterializedState = {
		id: "test-change-123",
		entity_id: "test-entity",
		schema_key: "lix_test",
		schema_version: "1.0",
		file_id: "lix",
		plugin_key: "test_plugin",
		snapshot_content: JSON.stringify({ id: "test-entity", value: "test-data" }),
		created_at: currentTimestamp,
		lixcol_version_id: versionId,
		lixcol_commit_id: commitId,
	};

	// Call updateStateCacheV2
	updateStateCache({
		lix,
		changes: [testChange],
	});

	// Verify cache entry was created/updated
	const cacheEntries = await (
		lix.db as unknown as Kysely<LixInternalDatabaseSchema>
	)
		.selectFrom("internal_state_cache")
		.selectAll()
		.select(sql`json(snapshot_content)`.as("snapshot_content"))
		.where("entity_id", "=", testChange.entity_id)
		.where("schema_key", "=", testChange.schema_key)
		.where("file_id", "=", testChange.file_id)
		.where("version_id", "=", versionId)
		.execute();

	expect(cacheEntries).toHaveLength(1);

	const cacheEntry = cacheEntries[0]!;
	expect(cacheEntry).toEqual({
		entity_id: testChange.entity_id,
		schema_key: testChange.schema_key,
		file_id: testChange.file_id,
		version_id: versionId,
		plugin_key: testChange.plugin_key,
		snapshot_content: JSON.parse(testChange.snapshot_content as any),
		schema_version: testChange.schema_version,
		created_at: currentTimestamp,
		updated_at: currentTimestamp,
		inherited_from_version_id: null,
		inheritance_delete_marker: 0,
		change_id: testChange.id,
		commit_id: commitId,
	} satisfies InternalStateCache);
});

test("upserts cache entry on conflict", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, bootstrap: true },
			},
		],
	});

	const initialTimestamp = timestamp({ lix });

	// Create initial test change (materialized)
	const versionId = "global";
	const initialCommitId = "initial-commit-123";
	const initialChange: MaterializedState = {
		id: "test-change-initial",
		entity_id: "test-entity-upsert",
		schema_key: "lix_test",
		schema_version: "1.0",
		file_id: "lix",
		plugin_key: "test_plugin",
		snapshot_content: JSON.stringify({
			id: "test-entity-upsert",
			value: "initial-data",
		}),
		created_at: initialTimestamp,
		lixcol_version_id: versionId,
		lixcol_commit_id: initialCommitId,
	};

	// First insert
	updateStateCache({
		lix,
		changes: [initialChange],
	});

	// Verify initial entry exists
	const intDb = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;
	const initialEntries = await intDb
		.selectFrom("internal_state_cache")
		.selectAll()
		.select(sql`json(snapshot_content)`.as("snapshot_content"))
		.where("entity_id", "=", initialChange.entity_id)
		.where("schema_key", "=", initialChange.schema_key)
		.where("file_id", "=", initialChange.file_id)
		.where("version_id", "=", versionId)
		.execute();

	expect(initialEntries).toHaveLength(1);
	expect(initialEntries[0]!.commit_id).toBe(initialCommitId);
	expect(initialEntries[0]!.snapshot_content).toEqual(
		JSON.parse(initialChange.snapshot_content as any)
	);

	// Now update with new data (same entity, schema, file, version - should trigger upsert)
	const updateTimestamp = timestamp({ lix });
	const updatedCommitId = "updated-commit-456";
	const updatedChange: MaterializedState = {
		id: "test-change-updated",
		entity_id: "test-entity-upsert", // Same entity
		schema_key: "lix_test", // Same schema
		schema_version: "1.1", // Different version
		file_id: "lix", // Same file
		plugin_key: "updated_plugin", // Different plugin
		snapshot_content: JSON.stringify({
			id: "test-entity-upsert",
			value: "updated-data",
		}), // Different content
		created_at: updateTimestamp,
		lixcol_version_id: versionId,
		lixcol_commit_id: updatedCommitId,
	};

	// Second call should trigger onConflict upsert
	updateStateCache({
		lix,
		changes: [updatedChange],
	});

	// Verify only one entry exists (upserted, not inserted as new)
	const finalEntries = await intDb
		.selectFrom("internal_state_cache")
		.selectAll()
		.select(sql`json(snapshot_content)`.as("snapshot_content"))
		.where("entity_id", "=", updatedChange.entity_id)
		.where("schema_key", "=", updatedChange.schema_key)
		.where("file_id", "=", updatedChange.file_id)
		.where("version_id", "=", versionId)
		.execute();

	expect(finalEntries).toHaveLength(1);

	const upsertedEntry = finalEntries[0]!;
	expect(upsertedEntry).toEqual({
		entity_id: updatedChange.entity_id,
		schema_key: updatedChange.schema_key,
		file_id: updatedChange.file_id,
		version_id: versionId,
		plugin_key: updatedChange.plugin_key, // Should be updated
		snapshot_content: JSON.parse(updatedChange.snapshot_content as any), // Should be updated
		schema_version: updatedChange.schema_version, // Should be updated
		created_at: initialTimestamp, // Should remain from initial insert (v2 now matches v1 behavior)
		updated_at: updateTimestamp, // Should be updated
		inherited_from_version_id: null,
		inheritance_delete_marker: 0,
		change_id: updatedChange.id, // Should be updated
		commit_id: updatedCommitId, // Should be updated
	} satisfies InternalStateCache);
});

test("handles inheritance chain deletions with tombstones", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, bootstrap: true },
			},
		],
	});

	// Define test version ids (no actual version rows needed for cache tests)
	const parentVersion = "parent-version";
	const childVersion = "child-version";
	const subchildVersion = "subchild-version";

	const baseTimestamp = timestamp({ lix });
	const testEntity = "inherited-entity";

	// 1. Create entity in parent version
	const createChange: MaterializedState = {
		id: "create-change-123",
		entity_id: testEntity,
		schema_key: "lix_test",
		schema_version: "1.0",
		file_id: "lix",
		plugin_key: "test_plugin",
		snapshot_content: JSON.stringify({
			id: testEntity,
			value: "parent-data",
		}),
		created_at: baseTimestamp,
		lixcol_version_id: parentVersion,
		lixcol_commit_id: "parent-commit-123",
	};

	updateStateCache({
		lix,
		changes: [createChange],
	});

	const intDb = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// 2. Verify entity exists in parent cache
	const parentCache = await intDb
		.selectFrom("internal_state_cache")
		.selectAll()
		.select(sql`json(snapshot_content)`.as("snapshot_content"))
		.where("entity_id", "=", testEntity)
		.where("version_id", "=", parentVersion)
		.execute();

	expect(parentCache).toHaveLength(1);
	expect(parentCache[0]?.snapshot_content).toEqual({
		id: testEntity,
		value: "parent-data",
	});

	// 3. Create tombstone in child version (deleting inherited entity)
	const deleteTimestamp = timestamp({ lix });
	const deleteChange: MaterializedState = {
		id: "delete-change-456",
		entity_id: testEntity,
		schema_key: "lix_test",
		schema_version: "1.0",
		file_id: "lix",
		plugin_key: "test_plugin",
		snapshot_content: null, // Tombstone
		created_at: deleteTimestamp,
		lixcol_version_id: childVersion,
		lixcol_commit_id: "child-commit-456",
	};

	updateStateCache({
		lix,
		changes: [deleteChange],
	});

	// 4. Verify parent still has the entity in cache
	const parentCacheAfterDelete = await intDb
		.selectFrom("internal_state_cache")
		.selectAll()
		.select(sql`json(snapshot_content)`.as("snapshot_content"))
		.where("entity_id", "=", testEntity)
		.where("version_id", "=", parentVersion)
		.execute();

	expect(parentCacheAfterDelete).toHaveLength(1);
	expect(parentCacheAfterDelete[0]?.snapshot_content).toEqual({
		id: testEntity,
		value: "parent-data",
	});

	// 5. Verify child version HAS a tombstone cache entry
	const childCacheAfterDelete = await intDb
		.selectFrom("internal_state_cache")
		.selectAll()
		.select(sql`json(snapshot_content)`.as("snapshot_content"))
		.where("entity_id", "=", testEntity)
		.where("version_id", "=", childVersion)
		.execute();

	expect(childCacheAfterDelete).toHaveLength(1);
	expect(childCacheAfterDelete[0]?.snapshot_content).toBeNull();
	expect(childCacheAfterDelete[0]?.change_id).toBe("delete-change-456");

	// 6. Verify subchild version has NO direct cache entry (inherits deletion from child)
	const subchildCacheAfterDelete = await intDb
		.selectFrom("internal_state_cache")
		.selectAll()
		.select(sql`json(snapshot_content)`.as("snapshot_content"))
		.where("entity_id", "=", testEntity)
		.where("version_id", "=", subchildVersion)
		.execute();

	expect(subchildCacheAfterDelete).toHaveLength(0);

	// 7. Verify cache entries are correct (tombstones filtered out)
	const parentStateAll = await intDb
		.selectFrom("internal_state_cache")
		.selectAll()
		.select(sql`json(snapshot_content)`.as("snapshot_content"))
		.where("entity_id", "=", testEntity)
		.where("version_id", "=", parentVersion)
		.where("inheritance_delete_marker", "=", 0)
		.where("snapshot_content", "is not", null)
		.execute();

	const childStateAll = await intDb
		.selectFrom("internal_state_cache")
		.selectAll()
		.select(sql`json(snapshot_content)`.as("snapshot_content"))
		.where("entity_id", "=", testEntity)
		.where("version_id", "=", childVersion)
		.where("inheritance_delete_marker", "=", 0)
		.where("snapshot_content", "is not", null)
		.execute();

	const subchildStateAll = await intDb
		.selectFrom("internal_state_cache")
		.selectAll()
		.select(sql`json(snapshot_content)`.as("snapshot_content"))
		.where("entity_id", "=", testEntity)
		.where("version_id", "=", subchildVersion)
		.where("inheritance_delete_marker", "=", 0)
		.where("snapshot_content", "is not", null)
		.execute();

	// Parent should show the entity
	expect(parentStateAll).toHaveLength(1);
	expect(parentStateAll[0]?.snapshot_content).toEqual({
		id: testEntity,
		value: "parent-data",
	});

	// Child should show NO entity (tombstone filtered out)
	expect(childStateAll).toHaveLength(0);

	// Subchild should show NO entity (inherits deletion from child)
	expect(subchildStateAll).toHaveLength(0);
});

test("handles duplicate entity updates - last change wins", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, bootstrap: true },
			},
		],
	});

	// Create test changes for the same entity
	const change1: MaterializedState = {
		id: "change-1",
		entity_id: "test-entity",
		schema_key: "test-schema",
		file_id: "test-file",
		plugin_key: "test-plugin",
		snapshot_content: JSON.stringify({ value: "first" }),
		schema_version: "1.0",
		created_at: "2024-01-01T00:00:00Z",
		lixcol_version_id: "version-1",
		lixcol_commit_id: "commit-1",
	};

	const change2: MaterializedState = {
		id: "change-2",
		entity_id: "test-entity", // Same entity
		schema_key: "test-schema",
		file_id: "test-file",
		plugin_key: "test-plugin",
		snapshot_content: JSON.stringify({ value: "second" }),
		schema_version: "1.0",
		created_at: "2024-01-01T00:01:00Z", // Later timestamp
		lixcol_version_id: "version-1",
		lixcol_commit_id: "commit-2",
	};

	// Apply first change
	updateStateCache({
		lix,
		changes: [change1],
	});

	// Apply second change (should overwrite first)
	updateStateCache({
		lix,
		changes: [change2],
	});

	// Query the cache to verify only the latest change is present
	const result = await (lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
		.selectFrom("internal_state_cache")
		.selectAll()
		.select(sql`json(snapshot_content)`.as("snapshot_content"))
		.where("entity_id", "=", "test-entity")
		.where("file_id", "=", "test-file")
		.where("version_id", "=", "version-1")
		.execute();

	// Should have exactly one row (latest change wins)
	expect(result).toHaveLength(1);

	// Should be the second change
	expect(result[0]!.change_id).toBe("change-2");
	expect(result[0]!.snapshot_content).toEqual({ value: "second" });
	expect(result[0]!.created_at).toBe("2024-01-01T00:00:00Z"); // Should preserve original created_at
	expect(result[0]!.updated_at).toBe("2024-01-01T00:01:00Z"); // Should update updated_at
});

test("handles batch updates with duplicates - last in batch wins", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, bootstrap: true },
			},
		],
	});

	// Create multiple changes for the same entity in a single batch
	const changes: MaterializedState[] = [
		{
			id: "change-1",
			entity_id: "test-entity",
			schema_key: "test-schema",
			file_id: "test-file",
			plugin_key: "test-plugin",
			snapshot_content: JSON.stringify({ value: "first" }),
			schema_version: "1.0",
			created_at: "2024-01-01T00:00:00Z",
			lixcol_version_id: "version-1",
			lixcol_commit_id: "commit-1",
		},
		{
			id: "change-2",
			entity_id: "test-entity", // Same entity
			schema_key: "test-schema",
			file_id: "test-file",
			plugin_key: "test-plugin",
			snapshot_content: JSON.stringify({ value: "second" }),
			schema_version: "1.0",
			created_at: "2024-01-01T00:01:00Z",
			lixcol_version_id: "version-1",
			lixcol_commit_id: "commit-1",
		},
		{
			id: "change-3",
			entity_id: "test-entity", // Same entity again
			schema_key: "test-schema",
			file_id: "test-file",
			plugin_key: "test-plugin",
			snapshot_content: JSON.stringify({ value: "third" }),
			schema_version: "1.0",
			created_at: "2024-01-01T00:02:00Z",
			lixcol_version_id: "version-1",
			lixcol_commit_id: "commit-1",
		},
	];

	// Apply all changes in a single batch
	updateStateCache({
		lix,
		changes,
	});

	// Query the cache to verify only the latest change is present
	const result = await (lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
		.selectFrom("internal_state_cache")
		.selectAll()
		.select(sql`json(snapshot_content)`.as("snapshot_content"))
		.where("entity_id", "=", "test-entity")
		.where("file_id", "=", "test-file")
		.where("version_id", "=", "version-1")
		.execute();

	// Should have exactly one row (last change in batch wins)
	expect(result).toHaveLength(1);

	// Should be the third change (last in batch)
	expect(result[0]!.change_id).toBe("change-3");
	expect(result[0]!.snapshot_content).toEqual({ value: "third" });
	expect(result[0]!.created_at).toBe("2024-01-01T00:00:00Z"); // Should preserve original created_at from first
	expect(result[0]!.updated_at).toBe("2024-01-01T00:02:00Z"); // Should use updated_at from last
});
