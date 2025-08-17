import { test, expect } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { populateStateCache } from "./populate-state-cache.js";
import { updateStateCache } from "./update-state-cache.js";
import { timestamp } from "../../deterministic/timestamp.js";
import type { LixChangeRaw } from "../../change/schema.js";
import { createVersion } from "../../version/create-version.js";
import { clearStateCache } from "./clear-state-cache.js";
import { sql } from "kysely";

test("populates v2 cache from materializer", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, bootstrap: true },
			},
		],
	});

	const currentTimestamp = timestamp({ lix });

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

	// Now clear and repopulate from materializer
	// Note: In a real scenario, the materializer would have this data
	// For testing, we'll simulate by inserting directly into the materializer view

	// Since we can't directly insert into the materializer (it's a view),
	// we'll test the populate function with filters instead

	// Test 1: Populate specific schema_key
	populateStateCache(lix, { schema_key: "lix_test" });

	// The function should have cleared and re-populated lix_test table
	// In real usage, it would read from materializer, but since we don't have
	// materializer data in this test, the table should be empty after clear
	const lixTestAfterPopulate = lix.sqlite.exec({
		sql: `SELECT * FROM internal_state_cache_lix_test`,
		returnValue: "resultRows",
		rowMode: "object",
	}) as any[];

	// Should be empty since materializer has no data
	expect(lixTestAfterPopulate).toHaveLength(0);

	// lix_other should remain unchanged
	const lixOtherAfterPopulate = lix.sqlite.exec({
		sql: `SELECT * FROM internal_state_cache_lix_other`,
		returnValue: "resultRows",
		rowMode: "object",
	}) as any[];

	expect(lixOtherAfterPopulate).toHaveLength(1);
	expect(lixOtherAfterPopulate[0].entity_id).toBe("entity-3");
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

	const currentTimestamp = timestamp({ lix });

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

	const currentTimestamp = timestamp({ lix });

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

test("populates parent versions when populating child version", async () => {
	// This test verifies that when populating cache for a child version,
	// all parent versions in the inheritance chain are also populated.
	// This is necessary because the child version needs access to inherited state.

	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, bootstrap: true },
			},
		],
	});

	const currentTimestamp = timestamp({ lix });

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
		inherits_from_version_id: versionA.id,
	});

	const versionC = await createVersion({
		lix,
		name: "Version C",
		id: "version_c",
		inherits_from_version_id: versionB.id,
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
			snapshot_content: JSON.stringify({ id: "entity_a", value: "from_version_a" }) as any,
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
			snapshot_content: JSON.stringify({ id: "entity_b", value: "from_version_b" }) as any,
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
			snapshot_content: JSON.stringify({ id: "entity_c", value: "from_version_c" }) as any,
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
	const cacheContents = await lix.db
		.selectFrom("internal_state_cache" as any)
		.select([
			"entity_id",
			"schema_key",
			"file_id",
			"version_id",
			"inherited_from_version_id",
			sql`json(snapshot_content)`.as("snapshot_content")
		])
		.where("schema_key", "=", "test_entity")
		.orderBy("entity_id")
		.execute() as any[];

	// EXPECTED BEHAVIOR: When populating version_c, the cache should contain
	// all entities that version_c can see through inheritance:
	// 1. entity_a from version_a (inherited through B -> A)
	// 2. entity_b from version_b (inherited from B)
	// 3. entity_c from version_c (direct)

	// All three entities should be in the cache
	expect(cacheContents).toHaveLength(3);

	// Verify entity_a is cached (inherited from version_a)
	// All entities are stored with version_id=version_c since that's the version viewing them
	const entityA = cacheContents.find((r: any) => r.entity_id === "entity_a");
	expect(entityA).toBeTruthy();
	expect(entityA.version_id).toBe(versionC.id); // Stored under version_c
	expect(entityA.inherited_from_version_id).toBe(versionA.id); // But inherited from version_a
	// snapshot_content is already a parsed object from the sql`json()` function
	expect(entityA.snapshot_content.value).toBe("from_version_a");

	// Verify entity_b is cached (inherited from version_b)
	const entityB = cacheContents.find((r: any) => r.entity_id === "entity_b");
	expect(entityB).toBeTruthy();
	expect(entityB.version_id).toBe(versionC.id); // Stored under version_c
	expect(entityB.inherited_from_version_id).toBe(versionB.id); // But inherited from version_b
	expect(entityB.snapshot_content.value).toBe("from_version_b");

	// Verify entity_c is cached (direct from version_c)
	const entityC = cacheContents.find((r: any) => r.entity_id === "entity_c");
	expect(entityC).toBeTruthy();
	expect(entityC.version_id).toBe(versionC.id); // Stored under version_c
	expect(entityC.inherited_from_version_id).toBeNull(); // Direct, not inherited
	expect(entityC.snapshot_content.value).toBe("from_version_c");

	// Additionally, verify that the cache entries match what the materializer provides
	const materializerView = await lix.db
		.selectFrom("internal_state_materializer" as any)
		.selectAll()
		.where("version_id", "=", versionC.id)
		.where("schema_key", "=", "test_entity")
		.orderBy("entity_id")
		.execute() as any[];

	// The cache should have the same entities as the materializer view
	expect(cacheContents.length).toBe(materializerView.length);

	// Verify that version_c in the materializer sees all three entities through inheritance
	expect(materializerView).toHaveLength(3);
	expect(materializerView.find((r: any) => r.entity_id === "entity_a")).toBeTruthy();
	expect(materializerView.find((r: any) => r.entity_id === "entity_b")).toBeTruthy();
	expect(materializerView.find((r: any) => r.entity_id === "entity_c")).toBeTruthy();
});
