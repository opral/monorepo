import { test, expect } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { updateStateCacheV2 } from "./update-state-cache-v2.js";
import { timestamp } from "../../deterministic/timestamp.js";
import { createVersion } from "../../version/create-version.js";
import { sql, type Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import type { LixChangeRaw } from "../../change/schema.js";

test("batch inserts multiple changes efficiently", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, bootstrap: true },
			},
		],
	});

	const currentTimestamp = timestamp({ lix });

	// Create multiple test changes
	const changes: LixChangeRaw[] = [];
	for (let i = 0; i < 100; i++) {
		changes.push({
			id: `test-change-${i}`,
			entity_id: `test-entity-${i}`,
			schema_key: "lix_test",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "test_plugin",
			snapshot_content: JSON.stringify({ id: `test-entity-${i}`, value: `test-data-${i}` }),
			created_at: currentTimestamp,
		});
	}

	const commitId = "batch-commit-456";
	const versionId = "global";

	// Call updateStateCacheV2 with batch
	const startTime = Date.now();
	updateStateCacheV2({
		lix,
		changes,
		commit_id: commitId,
		version_id: versionId,
	});
	const endTime = Date.now();

	// Verify all entries were created
	const cacheEntries = await (
		lix.db as unknown as Kysely<LixInternalDatabaseSchema>
	)
		.selectFrom("internal_state_cache_v2")
		.select(["entity_id", "schema_key"])
		.where("schema_key", "=", "lix_test")
		.where("version_id", "=", versionId)
		.execute();

	expect(cacheEntries).toHaveLength(100);

	// Verify execution was reasonably fast (batch should be faster than individual inserts)
	const executionTime = endTime - startTime;
	
	// Should complete in under 500ms (generous limit to account for CI/slow machines)
	expect(executionTime).toBeLessThan(500);
});

test("batch handles mixed insert/update/delete operations", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, bootstrap: true },
			},
		],
	});

	// Create inheritance chain
	await createVersion({
		lix,
		id: "parent",
		inherits_from_version_id: "global",
	});
	await createVersion({
		lix,
		id: "child",
		inherits_from_version_id: "parent",
	});

	const t1 = timestamp({ lix });

	// Step 1: Create initial entities
	const initialChanges: LixChangeRaw[] = [
		{
			id: "create-1",
			entity_id: "entity-1",
			schema_key: "batch_test",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "test_plugin",
			snapshot_content: JSON.stringify({ value: "data-1" }),
			created_at: t1,
		},
		{
			id: "create-2",
			entity_id: "entity-2",
			schema_key: "batch_test",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "test_plugin",
			snapshot_content: JSON.stringify({ value: "data-2" }),
			created_at: t1,
		},
		{
			id: "create-3",
			entity_id: "entity-3",
			schema_key: "batch_test",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "test_plugin",
			snapshot_content: JSON.stringify({ value: "data-3" }),
			created_at: t1,
		},
	];

	updateStateCacheV2({
		lix,
		changes: initialChanges,
		commit_id: "initial-commit",
		version_id: "parent",
	});

	const t2 = timestamp({ lix });

	// Step 2: Mixed batch - update, delete, and create new
	const mixedChanges: LixChangeRaw[] = [
		// Update entity-1
		{
			id: "update-1",
			entity_id: "entity-1",
			schema_key: "batch_test",
			schema_version: "1.1",
			file_id: "lix",
			plugin_key: "test_plugin",
			snapshot_content: JSON.stringify({ value: "updated-data-1" }),
			created_at: t2,
		},
		// Delete entity-2 (should copy to child)
		{
			id: "delete-2",
			entity_id: "entity-2",
			schema_key: "batch_test",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "test_plugin",
			snapshot_content: null,
			created_at: t2,
		},
		// Create new entity-4
		{
			id: "create-4",
			entity_id: "entity-4",
			schema_key: "batch_test",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "test_plugin",
			snapshot_content: JSON.stringify({ value: "data-4" }),
			created_at: t2,
		},
	];

	updateStateCacheV2({
		lix,
		changes: mixedChanges,
		commit_id: "mixed-commit",
		version_id: "parent",
	});

	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Verify parent version state
	const parentEntries = await db
		.selectFrom("internal_state_cache_v2")
		.select(["entity_id", "inheritance_delete_marker"])
		.select(sql`json(snapshot_content)`.as("snapshot_content"))
		.where("version_id", "=", "parent")
		.where("schema_key", "=", "batch_test")
		.orderBy("entity_id")
		.execute();

	expect(parentEntries).toHaveLength(4);
	
	// entity-1 should be updated
	const entity1 = parentEntries.find(e => e.entity_id === "entity-1");
	expect(entity1?.snapshot_content).toEqual({ value: "updated-data-1" });
	expect(entity1?.inheritance_delete_marker).toBe(0);

	// entity-2 should have tombstone
	const entity2 = parentEntries.find(e => e.entity_id === "entity-2");
	expect(entity2?.snapshot_content).toBeNull();
	expect(entity2?.inheritance_delete_marker).toBe(1);

	// entity-3 should be unchanged
	const entity3 = parentEntries.find(e => e.entity_id === "entity-3");
	expect(entity3?.snapshot_content).toEqual({ value: "data-3" });
	expect(entity3?.inheritance_delete_marker).toBe(0);

	// entity-4 should be new
	const entity4 = parentEntries.find(e => e.entity_id === "entity-4");
	expect(entity4?.snapshot_content).toEqual({ value: "data-4" });
	expect(entity4?.inheritance_delete_marker).toBe(0);

	// Verify child version has entity-2 copied down
	const childEntries = await db
		.selectFrom("internal_state_cache_v2")
		.select(["entity_id"])
		.select(sql`json(snapshot_content)`.as("snapshot_content"))
		.where("version_id", "=", "child")
		.where("schema_key", "=", "batch_test")
		.execute();

	expect(childEntries).toHaveLength(1);
	expect(childEntries[0]?.entity_id).toBe("entity-2");
	expect(childEntries[0]?.snapshot_content).toEqual({ value: "data-2" });
});

test("batch deletion with multiple children efficiently copies down", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, bootstrap: true },
			},
		],
	});

	// Create parent with multiple children
	await createVersion({
		lix,
		id: "parent",
		inherits_from_version_id: "global",
	});
	
	// Create 10 child versions
	for (let i = 0; i < 10; i++) {
		await createVersion({
			lix,
			id: `child-${i}`,
			inherits_from_version_id: "parent",
		});
	}

	const t1 = timestamp({ lix });

	// Create 20 entities in parent
	const createChanges: LixChangeRaw[] = [];
	for (let i = 0; i < 20; i++) {
		createChanges.push({
			id: `create-${i}`,
			entity_id: `entity-${i}`,
			schema_key: "batch_delete_test",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "test_plugin",
			snapshot_content: JSON.stringify({ value: `data-${i}` }),
			created_at: t1,
		});
	}

	updateStateCacheV2({
		lix,
		changes: createChanges,
		commit_id: "create-commit",
		version_id: "parent",
	});

	const t2 = timestamp({ lix });

	// Delete all 20 entities at once (should copy to all 10 children)
	const deleteChanges: LixChangeRaw[] = [];
	for (let i = 0; i < 20; i++) {
		deleteChanges.push({
			id: `delete-${i}`,
			entity_id: `entity-${i}`,
			schema_key: "batch_delete_test",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "test_plugin",
			snapshot_content: null,
			created_at: t2,
		});
	}

	const startTime = Date.now();
	updateStateCacheV2({
		lix,
		changes: deleteChanges,
		commit_id: "delete-commit",
		version_id: "parent",
	});
	const endTime = Date.now();

	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Verify all entities were copied to all children
	for (let i = 0; i < 10; i++) {
		const childEntries = await db
			.selectFrom("internal_state_cache_v2")
			.select("entity_id")
			.where("version_id", "=", `child-${i}`)
			.where("schema_key", "=", "batch_delete_test")
			.execute();

		expect(childEntries).toHaveLength(20);
	}

	// Should complete efficiently (20 deletes × 10 children = 200 copy operations)
	const executionTime = endTime - startTime;
	
	// Should complete in under 1000ms
	expect(executionTime).toBeLessThan(1000);
});