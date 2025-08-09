import { test, expect } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { populateStateCache } from "./populate-state-cache.js";
import { clearStateCache } from "./clear-state-cache.js";
import { sql, type Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import { createVersion } from "../../version/create-version.js";

test("should populate cache for a specific version_id", async () => {
	// Test that populateStateCache({ version_id: "global" }) populates only global version
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, bootstrap: true },
			},
		],
	});

	// Add some test data to the global version
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "test-key",
			value: "test-value",
			lixcol_version_id: "global",
		})
		.execute();

	// Clear any existing cache
	clearStateCache({ lix });

	// Populate cache for global version only
	populateStateCache(lix.sqlite, { version_id: "global" });

	// Query cache directly for our test entity using Kysely
	const cacheEntry = await (
		lix.db as unknown as Kysely<LixInternalDatabaseSchema>
	)
		.selectFrom("internal_state_cache")
		.selectAll()
		.select(sql`json(snapshot_content)`.as("snapshot_content"))
		.where("entity_id", "=", "test-key")
		.where("schema_key", "=", "lix_key_value")
		.execute();

	expect(cacheEntry).toHaveLength(1);

	// Should find our test data in the cache
	expect(cacheEntry[0]?.entity_id).toBe("test-key");
	expect(cacheEntry[0]?.version_id).toBe("global");
	expect(cacheEntry[0]?.schema_key).toBe("lix_key_value");

	// Verify the snapshot content contains our data
	const snapshot = cacheEntry[0]!.snapshot_content! as any;
	expect(snapshot.key).toBe("test-key");
	expect(snapshot.value).toBe("test-value");
});

test("should filter by entity_id when provided", async () => {
	// Test that populateStateCache({ version_id: "global", entity_id: "specific-entity" })
	// only populates cache entries for that specific entity
});

test("should filter by schema_key when provided", async () => {
	// Test that populateStateCache({ version_id: "global", schema_key: "lix_version" })
	// only populates cache entries for that specific schema
});

test("should filter by file_id when provided", async () => {
	// Test that populateStateCache({ version_id: "global", file_id: "lix" })
	// only populates cache entries for that specific file
});

test("should combine multiple filters correctly", async () => {
	// Test that populateStateCache({ version_id: "global", entity_id: "x", schema_key: "y" })
	// applies all filters together with AND logic
});

test("should delete existing cache entries before populating", async () => {
	// Test that existing cache entries matching the filters are cleared before new ones are inserted
	// This prevents duplicates
});

test("should handle empty materialization results gracefully", async () => {
	// Test behavior when the materializer returns no results for the given filters
	// Should clear matching cache entries but not error
});

test("should populate cache with correct inheritance relationships", async () => {
	// Test that inherited state is correctly populated with proper inherited_from_version_id values
	// Verify that inheritance_delete_marker is set to 0 (from materializer)
});

test("should handle version that doesn't exist in materializer", async () => {
	// Test behavior when requesting a version_id that has no materialized state
	// Should clear cache entries for that version but not error
});

test("should populate cache with all required columns", async () => {
	// Test that all expected columns are populated correctly:
	// entity_id, schema_key, file_id, version_id, plugin_key, snapshot_content,
	// schema_version, created_at, updated_at, inherited_from_version_id,
	// inheritance_delete_marker, change_id, commit_id
});

test("should implement copy-on-write semantics by only caching direct entries", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, bootstrap: true },
			},
		],
	});

	// Add some test data to global version
	await lix.db
		.insertInto("key_value")
		.values({
			key: "test-key",
			value: "test-value",
		})
		.execute();

	// Clear any existing cache
	clearStateCache({ lix });

	// Populate cache - should only copy direct entries (copy-on-write)
	populateStateCache(lix.sqlite);

	// Note: We don't check materializer entries here since internal_state_materializer
	// is not part of the public schema, but we verify cache behavior

	// Check what's in the cache - should only have direct entries
	const cacheEntries = await (
		lix.db as unknown as Kysely<LixInternalDatabaseSchema>
	)
		.selectFrom("internal_state_cache")
		.selectAll()
		.select(sql`json(snapshot_content)`.as("snapshot_content"))
		.where("entity_id", "=", "test-key")
		.where("schema_key", "=", "lix_key_value")
		.execute();

	// Cache should only contain direct entries (inherited_from_version_id IS NULL)
	expect(cacheEntries).toHaveLength(1);
	expect(cacheEntries[0]?.inherited_from_version_id).toBeNull();

	// Populate cache multiple times - should not create duplicates due to DELETE before INSERT
	populateStateCache(lix.sqlite);
	populateStateCache(lix.sqlite);

	const cacheEntriesAfterMultiplePopulate = await (
		lix.db as unknown as Kysely<LixInternalDatabaseSchema>
	)
		.selectFrom("internal_state_cache")
		.selectAll()
		.select(sql`json(snapshot_content)`.as("snapshot_content"))
		.where("entity_id", "=", "test-key")
		.where("schema_key", "=", "lix_key_value")
		.execute();

	// Should still have exactly one entry (no duplicates)
	expect(cacheEntriesAfterMultiplePopulate).toHaveLength(1);

	// Verify copy-on-write: check that all cache entries have inherited_from_version_id = null
	const allCacheEntries = await (
		lix.db as unknown as Kysely<LixInternalDatabaseSchema>
	)
		.selectFrom("internal_state_cache")
		.selectAll()
		.select(sql`json(snapshot_content)`.as("snapshot_content"))
		.execute();

	for (const entry of allCacheEntries) {
		expect(entry.inherited_from_version_id).toBeNull();
	}
});

test("should cache tombstones (delete markers) when they are direct entries", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, bootstrap: true },
			},
		],
	});

	// First, create an entity in the global version
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "to-be-deleted",
			value: "original-value",
			lixcol_version_id: "global",
		})
		.execute();

	await createVersion({
		lix: lix,
		id: "feature-version",
	});

	// Create a delete marker (tombstone) in the feature version
	await lix.db
		.deleteFrom("key_value_all")
		.where("key", "=", "to-be-deleted")
		.where("lixcol_version_id", "=", "feature-version")
		.execute();

	// Clear cache and populate for the feature version
	clearStateCache({ lix });

	populateStateCache(lix.sqlite, { version_id: "feature-version" });

	// Check cache entries for the deleted entity in feature version
	const cacheEntries = await (
		lix.db as unknown as Kysely<LixInternalDatabaseSchema>
	)
		.selectFrom("internal_state_cache")
		.selectAll()
		.select(sql`json(snapshot_content)`.as("snapshot_content"))
		.where("entity_id", "=", "to-be-deleted")
		.where("schema_key", "=", "lix_key_value")
		.where("version_id", "=", "feature-version")
		.execute();

	// Should have a cache entry for the tombstone since it's a direct entry in feature-version
	expect(cacheEntries).toHaveLength(1);
	expect(cacheEntries[0]?.inherited_from_version_id).toBeNull();
	expect(cacheEntries[0]?.version_id).toBe("feature-version");

	// The snapshot content should be null for tombstones
	expect(cacheEntries[0]?.snapshot_content).toBeNull();

	// Check resolved state for global version - should have the entity
	const globalResolvedState = await lix.db
		.selectFrom("state_all")
		.selectAll()
		.where("entity_id", "=", "to-be-deleted")
		.where("schema_key", "=", "lix_key_value")
		.where("version_id", "=", "global")
		.execute();

	expect(globalResolvedState).toHaveLength(1);
	expect((globalResolvedState[0]?.snapshot_content as any)?.value).toBe(
		"original-value"
	);

	// Check resolved state for feature-version - should NOT have the entity (it's deleted)
	const featureResolvedState = await lix.db
		.selectFrom("state_all")
		.selectAll()
		.where("entity_id", "=", "to-be-deleted")
		.where("schema_key", "=", "lix_key_value")
		.where("version_id", "=", "feature-version")
		.execute();

	// The resolved state should NOT include tombstones - they should be filtered out
	// Only the cache should include tombstones for proper deletion handling
	expect(featureResolvedState).toHaveLength(0);
});
