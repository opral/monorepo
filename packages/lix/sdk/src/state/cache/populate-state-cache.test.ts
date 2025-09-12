import { test, expect } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { populateStateCache } from "./populate-state-cache.js";
import { updateStateCache } from "./update-state-cache.js";
import { getTimestampSync } from "../../runtime/deterministic/timestamp.js";
import type { LixChangeRaw } from "../../change/schema.js";
import { clearStateCache } from "./clear-state-cache.js";
import { createVersion } from "../../version/create-version.js";
import { Kysely, sql } from "kysely";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";

test("populates v2 cache from materializer", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, bootstrap: true },
			},
		],
	});

	const currentTimestamp = getTimestampSync({ lix });

	// First, insert some test data using updateStateCacheV2
	const testChanges: LixChangeRaw[] = [
		{
			id: "test-change-1",
			entity_id: "entity-1",
			schema_key: "lix_test",
			schema_version: "1.0",
			file_id: "file1",
			plugin_key: "test_plugin",
			snapshot_content: JSON.stringify({ id: "entity-1", value: "test1" }),
			created_at: currentTimestamp,
		},
		{
			id: "test-change-2",
			entity_id: "entity-2",
			schema_key: "lix_test",
			schema_version: "1.0",
			file_id: "file2",
			plugin_key: "test_plugin",
			snapshot_content: JSON.stringify({ id: "entity-2", value: "test2" }),
			created_at: currentTimestamp,
		},
		{
			id: "test-change-3",
			entity_id: "entity-3",
			schema_key: "lix_other",
			schema_version: "1.0",
			file_id: "file1",
			plugin_key: "test_plugin",
			snapshot_content: JSON.stringify({ id: "entity-3", value: "test3" }),
			created_at: currentTimestamp,
		},
	];

	// Insert data into v2 cache
	updateStateCache({
		lix,
		changes: testChanges,
		commit_id: "test-commit-1",
		version_id: "global",
	});

	// Check lix_test table
	const lixTestTable = lix.sqlite.exec({
		sql: `SELECT * FROM internal_state_cache_lix_test ORDER BY entity_id`,
		returnValue: "resultRows",
		rowMode: "object",
	}) as any[];

	expect(lixTestTable).toHaveLength(2);
	expect(lixTestTable[0].entity_id).toBe("entity-1");
	expect(lixTestTable[1].entity_id).toBe("entity-2");

	// Check lix_other table
	const lixOtherTable = lix.sqlite.exec({
		sql: `SELECT * FROM internal_state_cache_lix_other ORDER BY entity_id`,
		returnValue: "resultRows",
		rowMode: "object",
	}) as any[];

	expect(lixOtherTable).toHaveLength(1);
	expect(lixOtherTable[0].entity_id).toBe("entity-3");
});

test("populates v2 cache with version filter", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, bootstrap: true },
			},
		],
	});

	const currentTimestamp = getTimestampSync({ lix });

	// Insert test data for different versions
	const changes: LixChangeRaw[] = [
		{
			id: "change-v1-1",
			entity_id: "entity-v1",
			schema_key: "lix_test",
			schema_version: "1.0",
			file_id: "file1",
			plugin_key: "test_plugin",
			snapshot_content: JSON.stringify({ id: "entity-v1", value: "v1" }),
			created_at: currentTimestamp,
		},
	];

	updateStateCache({
		lix,
		changes,
		commit_id: "commit-v1",
		version_id: "version-1",
	});

	const changesV2: LixChangeRaw[] = [
		{
			id: "change-v2-1",
			entity_id: "entity-v2",
			schema_key: "lix_test",
			schema_version: "1.0",
			file_id: "file1",
			plugin_key: "test_plugin",
			snapshot_content: JSON.stringify({ id: "entity-v2", value: "v2" }),
			created_at: currentTimestamp,
		},
	];

	updateStateCache({
		lix,
		changes: changesV2,
		commit_id: "commit-v2",
		version_id: "version-2",
	});

	// Verify both versions exist
	const allData = lix.sqlite.exec({
		sql: `SELECT * FROM internal_state_cache_lix_test ORDER BY entity_id`,
		returnValue: "resultRows",
		rowMode: "object",
	}) as any[];

	expect(allData).toHaveLength(2);
	expect(allData[0].version_id).toBe("version-1");
	expect(allData[1].version_id).toBe("version-2");

	// Populate only version-1
	populateStateCache(lix, { version_id: "version-1" });

	// Check that version-1 was cleared (no materializer data to re-populate)
	// but version-2 remains
	const afterPopulate = lix.sqlite.exec({
		sql: `SELECT * FROM internal_state_cache_lix_test ORDER BY entity_id`,
		returnValue: "resultRows",
		rowMode: "object",
	}) as any[];

	expect(afterPopulate).toHaveLength(1);
	expect(afterPopulate[0].version_id).toBe("version-2");
	expect(afterPopulate[0].entity_id).toBe("entity-v2");
});

test("clears all v2 cache tables when no filters specified", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, bootstrap: true },
			},
		],
	});

	const currentTimestamp = getTimestampSync({ lix });

	// Insert data into multiple schema tables
	const changes: LixChangeRaw[] = [
		{
			id: "change-1",
			entity_id: "entity-1",
			schema_key: "schema_a",
			schema_version: "1.0",
			file_id: "file1",
			plugin_key: "test_plugin",
			snapshot_content: JSON.stringify({ id: "entity-1", value: "a" }),
			created_at: currentTimestamp,
		},
		{
			id: "change-2",
			entity_id: "entity-2",
			schema_key: "schema_b",
			schema_version: "1.0",
			file_id: "file1",
			plugin_key: "test_plugin",
			snapshot_content: JSON.stringify({ id: "entity-2", value: "b" }),
			created_at: currentTimestamp,
		},
		{
			id: "change-3",
			entity_id: "entity-3",
			schema_key: "schema_c",
			schema_version: "1.0",
			file_id: "file1",
			plugin_key: "test_plugin",
			snapshot_content: JSON.stringify({ id: "entity-3", value: "c" }),
			created_at: currentTimestamp,
		},
	];

	updateStateCache({
		lix,
		changes,
		commit_id: "commit-1",
		version_id: "global",
	});

	// Verify data exists in all tables
	const schemaA = lix.sqlite.exec({
		sql: `SELECT * FROM internal_state_cache_schema_a`,
		returnValue: "resultRows",
	});
	const schemaB = lix.sqlite.exec({
		sql: `SELECT * FROM internal_state_cache_schema_b`,
		returnValue: "resultRows",
	});
	const schemaC = lix.sqlite.exec({
		sql: `SELECT * FROM internal_state_cache_schema_c`,
		returnValue: "resultRows",
	});

	expect(schemaA).toHaveLength(1);
	expect(schemaB).toHaveLength(1);
	expect(schemaC).toHaveLength(1);

	// Populate with no filters (should clear all)
	populateStateCache(lix);

	// All tables should be empty now (no materializer data)
	const schemaAAfter = lix.sqlite.exec({
		sql: `SELECT * FROM internal_state_cache_schema_a`,
		returnValue: "resultRows",
	});
	const schemaBAfter = lix.sqlite.exec({
		sql: `SELECT * FROM internal_state_cache_schema_b`,
		returnValue: "resultRows",
	});
	const schemaCAfter = lix.sqlite.exec({
		sql: `SELECT * FROM internal_state_cache_schema_c`,
		returnValue: "resultRows",
	});

	expect(schemaAAfter).toHaveLength(0);
	expect(schemaBAfter).toHaveLength(0);
	expect(schemaCAfter).toHaveLength(0);
});

// This test verifies that when populating cache for a child version,
// all parent versions in the inheritance chain are also populated.
// This is necessary because the child version needs access to inherited state.
test("inheritance is queryable from the resolved view after population", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
			},
		],
	});

	const currentTimestamp = getTimestampSync({ lix });

	// Create version hierarchy: C inherits from B, B inherits from A
	const versionA = await createVersion({
		lix,
		name: "Version A",
		id: "version_a",
	});

	const versionB = await createVersion({
		lix,
		name: "Version B",
		id: "version_b",
		inheritsFrom: versionA,
	});

	const versionC = await createVersion({
		lix,
		name: "Version C",
		id: "version_c",
		inheritsFrom: versionB,
	});

	// Insert test entities directly into state_all for each version using Kysely
	// Entity in version A
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "entity_a",
			schema_key: "test_entity",
			file_id: "file1",
			version_id: versionA.id,
			plugin_key: "test_plugin",
			snapshot_content: JSON.stringify({
				id: "entity_a",
				value: "from_version_a",
			}) as any,
			schema_version: "1.0",
			created_at: currentTimestamp,
			updated_at: currentTimestamp,
		})
		.execute();

	// Entity in version B
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "entity_b",
			schema_key: "test_entity",
			file_id: "file1",
			version_id: versionB.id,
			plugin_key: "test_plugin",
			snapshot_content: JSON.stringify({
				id: "entity_b",
				value: "from_version_b",
			}) as any,
			schema_version: "1.0",
			created_at: currentTimestamp,
			updated_at: currentTimestamp,
		})
		.execute();

	// Entity in version C
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "entity_c",
			schema_key: "test_entity",
			file_id: "file1",
			version_id: versionC.id,
			plugin_key: "test_plugin",
			snapshot_content: JSON.stringify({
				id: "entity_c",
				value: "from_version_c",
			}) as any,
			schema_version: "1.0",
			created_at: currentTimestamp,
			updated_at: currentTimestamp,
		})
		.execute();

	// Clear all cache to start fresh
	clearStateCache({ lix });

	// ACT: Populate ONLY version C
	populateStateCache(lix, { version_id: versionC.id });

	// ASSERT: Check what got populated in the cache
	// Read from the virtual table internal_state_cache using Kysely with json function
	const resolvedContents = await (
		lix.db as unknown as Kysely<LixInternalDatabaseSchema>
	)
		.selectFrom("internal_resolved_state_all")
		.select([
			"entity_id",
			"schema_key",
			"file_id",
			"version_id",
			"inherited_from_version_id",
			sql`json(snapshot_content)`.as("snapshot_content"),
		])
		.where("schema_key", "=", "test_entity")
		.where("version_id", "=", versionC.id)
		.orderBy("entity_id")
		.execute();

	// EXPECTED BEHAVIOR: When populating version_c, the cache should contain
	// all entities that version_c can see through inheritance:
	// 1. entity_a from version_a (inherited through B -> A)
	// 2. entity_b from version_b (inherited from B)
	// 3. entity_c from version_c (direct)

	// All three entities should be in the cache
	expect(resolvedContents).toHaveLength(3);

	// Verify entity_a is cached (inherited from version_a)
	// All entities are stored with version_id=version_c since that's the version viewing them
	const entityA = resolvedContents.find((r: any) => r.entity_id === "entity_a");
	expect(entityA).toBeTruthy();
	expect(entityA?.version_id).toBe(versionC.id); // Stored under version_c
	expect(entityA?.inherited_from_version_id).toBe(versionA.id); // But inherited from version_a
	// snapshot_content is already a parsed object from the sql`json()` function
	expect((entityA?.snapshot_content as any).value).toBe("from_version_a");

	// Verify entity_b is cached (inherited from version_b)
	const entityB = resolvedContents.find((r: any) => r.entity_id === "entity_b");
	expect(entityB).toBeTruthy();
	expect(entityB?.version_id).toBe(versionC.id); // Stored under version_c
	expect(entityB?.inherited_from_version_id).toBe(versionB.id); // But inherited from version_b
	expect((entityB?.snapshot_content as any).value).toBe("from_version_b");

	// Verify entity_c is cached (direct from version_c)
	const entityC = resolvedContents.find((r: any) => r.entity_id === "entity_c");
	expect(entityC).toBeTruthy();
	expect(entityC?.version_id).toBe(versionC.id); // Stored under version_c
	expect(entityC?.inherited_from_version_id).toBeNull(); // Direct, not inherited
	expect((entityC?.snapshot_content as any).value).toBe("from_version_c");
});

test("global version entities are populated when populating child versions", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
			},
		],
	});

	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Create a test version that will inherit from global
	const testVersion = await createVersion({
		lix,
		name: "Test Version",
		id: "test_version_1",
	});

	// Insert a test entity into state_all for global version
	// This simulates entities that exist in global and should be inherited by all versions
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "global_entity_1",
			schema_key: "test_entity",
			file_id: "test_file",
			version_id: "global",
			plugin_key: "test_plugin",
			snapshot_content: JSON.stringify({
				id: "global_entity_1",
				value: "from_global",
				updated_after_merge: true,
			}) as any,
			schema_version: "1.0",
		})
		.execute();

	// Verify the test version can see this entity through inheritance before cache miss
	const beforeCacheMiss = await db
		.selectFrom("state_all")
		.where("version_id", "=", testVersion.id)
		.where("schema_key", "=", "test_entity")
		.where("entity_id", "=", "global_entity_1")
		.select([
			"entity_id",
			"change_id",
			sql`json(snapshot_content)`.as("snapshot_content"),
		])
		.execute();

	expect(beforeCacheMiss).toHaveLength(1);
	const originalChangeId = beforeCacheMiss[0]?.change_id;
	expect((beforeCacheMiss[0]?.snapshot_content as any).value).toBe(
		"from_global"
	);

	// Clear all cache to simulate cache miss
	clearStateCache({ lix });

	// ACT: Populate the test version's cache (simulating cache miss recovery)
	populateStateCache(lix, { version_id: testVersion.id });

	// ASSERT: After cache population, the test version should still see the global entity
	const afterCachePopulation = await db
		.selectFrom("state_all")
		.where("version_id", "=", testVersion.id)
		.where("schema_key", "=", "test_entity")
		.where("entity_id", "=", "global_entity_1")
		.select([
			"entity_id",
			"change_id",
			sql`json(snapshot_content)`.as("snapshot_content"),
		])
		.execute();

	// Should still see the entity with the same change_id
	expect(afterCachePopulation).toHaveLength(1);
	expect(afterCachePopulation[0]?.change_id).toBe(originalChangeId);
	expect((afterCachePopulation[0]?.snapshot_content as any).value).toBe(
		"from_global"
	);

	// Check the physical cache directly: the parent/global authored entry
	// should be materialized in its own version's cache table.
	const cacheEntries = await db
		.selectFrom("internal_state_cache_test_entity" as any)
		.where("entity_id", "=", "global_entity_1")
		.select([
			"entity_id",
			"change_id",
			"version_id",
			"inherited_from_version_id",
		])
		.execute();

	const globalEntry = cacheEntries.find((e: any) => e.version_id === "global");
	expect(globalEntry).toBeTruthy();
	expect(globalEntry?.change_id).toBe(originalChangeId);

	// Inheritance is resolved at read time via the resolved view.
	// Verify the child version sees the inherited row from global.
	const resolvedInherited = await db
		.selectFrom("internal_resolved_state_all")
		.where("version_id", "=", testVersion.id)
		.where("schema_key", "=", "test_entity")
		.where("entity_id", "=", "global_entity_1")
		.select([
			"entity_id",
			"change_id",
			"version_id",
			"inherited_from_version_id",
			sql`json(snapshot_content)`.as("snapshot_content"),
		])
		.execute();

	expect(resolvedInherited).toHaveLength(1);
	expect(resolvedInherited[0]?.version_id).toBe(testVersion.id);
	expect(resolvedInherited[0]?.inherited_from_version_id).toBe("global");
	expect(resolvedInherited[0]?.change_id).toBe(originalChangeId);
	expect((resolvedInherited[0]?.snapshot_content as any).value).toBe(
		"from_global"
	);
});
