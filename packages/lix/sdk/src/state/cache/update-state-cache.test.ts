import { test, expect } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { updateStateCache } from "./update-state-cache.js";
import { getTimestamp } from "../../engine/functions/timestamp.js";
import type { MaterializedState } from "../vtable/generate-commit.js";
import type { InternalStateCache } from "./schema.js";
import { schemaKeyToCacheTableName } from "./create-schema-cache-table.js";

test("inserts into cache based on change", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
			},
		],
	});

	const currentTimestamp = await getTimestamp({ lix });

	// Create a test change (materialized with inline version/commit)
	const commitId = "test-commit-456";
	const versionId = "global";
	const testChange: MaterializedState = {
		id: "test-change-123",
		entity_id: "test-entity",
		schema_key: "test_cache_insert",
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
		engine: lix.engine!,
		changes: [testChange],
	});

	const table = schemaKeyToCacheTableName("test_cache_insert");
	const { rows: cacheRows } = lix.engine!.executeSync({
		sql: `
			SELECT
				*,
				json(snapshot_content) AS snapshot_content
			FROM ${table}
			WHERE entity_id = ?
				AND schema_key = ?
				AND file_id = ?
				AND version_id = ?
		`,
		parameters: [
			testChange.entity_id,
			testChange.schema_key,
			testChange.file_id,
			versionId,
		],
	});

	expect(cacheRows).toHaveLength(1);
	const cacheEntry = cacheRows[0]!;
	expect(cacheEntry).toEqual({
		entity_id: testChange.entity_id,
		schema_key: testChange.schema_key,
		file_id: testChange.file_id,
		version_id: versionId,
		plugin_key: testChange.plugin_key,
		snapshot_content: testChange.snapshot_content,
		schema_version: testChange.schema_version,
		created_at: currentTimestamp,
		updated_at: currentTimestamp,
		inherited_from_version_id: null,
		is_tombstone: 0,
		change_id: testChange.id,
		commit_id: commitId,
	} satisfies InternalStateCache);
});

test("upserts cache entry on conflict", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
			},
		],
	});

	const initialTimestamp = await getTimestamp({ lix });

	// Create initial test change (materialized)
	const versionId = "global";
	const initialCommitId = "initial-commit-123";
	const initialChange: MaterializedState = {
		id: "test-change-initial",
		entity_id: "test-entity-upsert",
		schema_key: "test_cache_upsert",
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
		engine: lix.engine!,
		changes: [initialChange],
	});

	const table = schemaKeyToCacheTableName("test_cache_upsert");
	const selectRows = () => {
		const { rows } = lix.engine!.executeSync({
			sql: `
				SELECT
					*,
					json(snapshot_content) AS snapshot_content
				FROM ${table}
				WHERE entity_id = ?
					AND schema_key = ?
					AND file_id = ?
					AND version_id = ?
			`,
			parameters: [
				initialChange.entity_id,
				initialChange.schema_key,
				initialChange.file_id,
				versionId,
			],
		});
		return rows ?? [];
	};

	const initialEntries = selectRows();
	expect(initialEntries).toHaveLength(1);
	expect(initialEntries[0]!.commit_id).toBe(initialCommitId);
	expect(initialEntries[0]!.snapshot_content).toBe(
		initialChange.snapshot_content
	);

	// Now update with new data (same entity, schema, file, version - should trigger upsert)
	const updateTimestamp = await getTimestamp({ lix });
	const updatedCommitId = "updated-commit-456";
	const updatedChange: MaterializedState = {
		id: "test-change-updated",
		entity_id: "test-entity-upsert", // Same entity
		schema_key: "test_cache_upsert", // Same schema
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
		engine: lix.engine!,
		changes: [updatedChange],
	});

	const finalEntries = selectRows();

	expect(finalEntries).toHaveLength(1);

	const upsertedEntry = finalEntries[0]!;
	expect(upsertedEntry).toMatchObject({
		entity_id: updatedChange.entity_id,
		schema_key: updatedChange.schema_key,
		file_id: updatedChange.file_id,
		version_id: versionId,
		plugin_key: updatedChange.plugin_key,
		schema_version: updatedChange.schema_version,
		created_at: initialTimestamp,
		updated_at: updateTimestamp,
		inherited_from_version_id: null,
		is_tombstone: 0,
		change_id: updatedChange.id,
		commit_id: updatedCommitId,
	});
	expect(upsertedEntry.snapshot_content).toBe(updatedChange.snapshot_content);
});

test("handles inheritance chain deletions with tombstones", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
			},
		],
	});

	// Define test version ids (no actual version rows needed for cache tests)
	const parentVersion = "parent-version";
	const childVersion = "child-version";
	const subchildVersion = "subchild-version";

	const baseTimestamp = await getTimestamp({ lix });
	const testEntity = "inherited-entity";

	// 1. Create entity in parent version
	const createChange: MaterializedState = {
		id: "create-change-123",
		entity_id: testEntity,
		schema_key: "test_cache_inherit",
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
		engine: lix.engine!,
		changes: [createChange],
	});

	const table = schemaKeyToCacheTableName("test_cache_inherit");
	const selectRows = (versionId: string, extra = "") => {
		const { rows } = lix.engine!.executeSync({
			sql: `
				SELECT
					entity_id,
					schema_key,
					file_id,
					version_id,
					plugin_key,
					json(snapshot_content) AS snapshot_content,
					schema_version,
					created_at,
					updated_at,
					inherited_from_version_id,
					is_tombstone,
					change_id,
					commit_id
				FROM ${table}
				WHERE entity_id = ?
					AND version_id = ?${extra}
			`,
			parameters: [testEntity, versionId],
		});
		return rows ?? [];
	};

	// 2. Verify entity exists in parent cache
	const parentCache = selectRows(parentVersion);
	expect(parentCache).toHaveLength(1);
	expect(parentCache[0]!.snapshot_content).toBe(createChange.snapshot_content);

	// 3. Create tombstone in child version (deleting inherited entity)
	const deleteTimestamp = await getTimestamp({ lix });
	const deleteChange: MaterializedState = {
		id: "delete-change-456",
		entity_id: testEntity,
		schema_key: "test_cache_inherit",
		schema_version: "1.0",
		file_id: "lix",
		plugin_key: "test_plugin",
		snapshot_content: null, // Tombstone
		created_at: deleteTimestamp,
		lixcol_version_id: childVersion,
		lixcol_commit_id: "child-commit-456",
	};

	updateStateCache({
		engine: lix.engine!,
		changes: [deleteChange],
	});

	// 4. Verify parent still has the entity in cache
	const parentCacheAfterDelete = selectRows(parentVersion);
	expect(parentCacheAfterDelete).toHaveLength(1);
	expect(parentCacheAfterDelete[0]!.snapshot_content).toBe(
		createChange.snapshot_content
	);

	// 5. Verify child version HAS a tombstone cache entry
	const childCacheAfterDelete = selectRows(childVersion);
	expect(childCacheAfterDelete).toHaveLength(1);
	expect(childCacheAfterDelete[0]?.snapshot_content).toBeNull();
	expect(childCacheAfterDelete[0]?.change_id).toBe("delete-change-456");

	// 6. Verify subchild version has NO direct cache entry (inherits deletion from child)
	const subchildCacheAfterDelete = selectRows(subchildVersion);
	expect(subchildCacheAfterDelete).toHaveLength(0);

	// 7. Verify cache entries are correct (tombstones filtered out)
	const selectLiveRows = (versionId: string) => {
		const { rows } = lix.engine!.executeSync({
			sql: `
				SELECT
					entity_id,
					schema_key,
					file_id,
					version_id,
					plugin_key,
					json(snapshot_content) AS snapshot_content,
					schema_version,
					created_at,
					updated_at,
					inherited_from_version_id,
					is_tombstone,
					change_id,
					commit_id
				FROM ${table}
				WHERE entity_id = ?
					AND version_id = ?
					AND is_tombstone = 0
					AND snapshot_content IS NOT NULL
			`,
			parameters: [testEntity, versionId],
		});
		return rows ?? [];
	};

	const parentStateAll = selectLiveRows(parentVersion);
	const childStateAll = selectLiveRows(childVersion);
	const subchildStateAll = selectLiveRows(subchildVersion);

	// Parent should show the entity
	expect(parentStateAll).toHaveLength(1);
	expect(parentStateAll[0]!.snapshot_content).toBe(
		createChange.snapshot_content
	);

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
				value: { enabled: true },
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
		engine: lix.engine!,
		changes: [change1],
	});

	// Apply second change (should overwrite first)
	updateStateCache({
		engine: lix.engine!,
		changes: [change2],
	});

	// Query the cache to verify only the latest change is present
	const table = schemaKeyToCacheTableName("test-schema");
	const { rows: resultRows } = lix.engine!.executeSync({
		sql: `
			SELECT
				entity_id,
				schema_key,
				file_id,
				version_id,
				plugin_key,
				json(snapshot_content) AS snapshot_content,
				schema_version,
				created_at,
				updated_at,
				inherited_from_version_id,
				is_tombstone,
				change_id,
				commit_id
			FROM ${table}
			WHERE entity_id = ?
				AND file_id = ?
				AND version_id = ?
		`,
		parameters: ["test-entity", "test-file", "version-1"],
	});
	const result = resultRows ?? [];

	// Should have exactly one row (latest change wins)
	expect(result).toHaveLength(1);

	// Should be the second change
	expect(result[0]!.change_id).toBe("change-2");
	expect(result[0]!.snapshot_content).toBe(change2.snapshot_content);
	expect(result[0]!.created_at).toBe("2024-01-01T00:00:00Z"); // Should preserve original created_at
	expect(result[0]!.updated_at).toBe("2024-01-01T00:01:00Z"); // Should update updated_at
});

test("handles batch updates with duplicates - last in batch wins", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
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
		engine: lix.engine!,
		changes,
	});

	// Query the cache to verify only the latest change is present
	const table = schemaKeyToCacheTableName("test-schema");
	const { rows: batchRowResults } = lix.engine!.executeSync({
		sql: `
		SELECT
			entity_id,
			schema_key,
			file_id,
			version_id,
			plugin_key,
			json(snapshot_content) AS snapshot_content,
			schema_version,
			created_at,
			updated_at,
			inherited_from_version_id,
			is_tombstone,
			change_id,
			commit_id
		FROM ${table}
		WHERE entity_id = ?
			AND file_id = ?
			AND version_id = ?
	`,
		parameters: ["test-entity", "test-file", "version-1"],
	});
	const result = batchRowResults ?? [];

	// Should have exactly one row (last change in batch wins)
	expect(result).toHaveLength(1);

	// Should be the third change (last in batch)
	expect(result[0]!.change_id).toBe("change-3");
	expect(result[0]!.snapshot_content).toBe(changes[2]!.snapshot_content);
	expect(result[0]!.created_at).toBe("2024-01-01T00:00:00Z"); // Should preserve original created_at from first
	expect(result[0]!.updated_at).toBe("2024-01-01T00:02:00Z"); // Should use updated_at from last
});

test("derived edge cache rows reference the commit change id", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});

	const now = await getTimestamp({ lix });
	const parentId = "edge-parent";
	const childId = "edge-child";
	const changeSetId = "edge-cs";
	const commitChangeId = "edge-commit-change";

	// Insert real commit change
	await lix.db
		.insertInto("change")
		.values({
			id: commitChangeId,
			entity_id: childId,
			schema_key: "lix_commit",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: {
				id: childId,
				change_set_id: changeSetId,
				parent_commit_ids: [parentId],
			},
			created_at: now,
		})
		.execute();

	// Push to cache so edges are derived
	updateStateCache({
		engine: lix.engine!,
		version_id: "global",
		commit_id: childId,
		changes: [
			{
				id: commitChangeId,
				entity_id: childId,
				schema_key: "lix_commit",
				schema_version: "1.0",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					id: childId,
					change_set_id: changeSetId,
					parent_commit_ids: [parentId],
				}),
				created_at: now,
			},
		],
	});

	const joined = await lix.db
		.selectFrom("commit_edge_all")
		.innerJoin("change", "change.id", "commit_edge_all.lixcol_change_id")
		.where("commit_edge_all.lixcol_version_id", "=", "global")
		.where("commit_edge_all.parent_id", "=", parentId)
		.where("commit_edge_all.child_id", "=", childId)
		.select([
			"commit_edge_all.parent_id as parent_id",
			"commit_edge_all.child_id as child_id",
			"commit_edge_all.lixcol_change_id as change_id",
			"change.entity_id as change_entity_id",
			"change.snapshot_content as snap",
		])
		.executeTakeFirstOrThrow();

	expect(joined.parent_id).toBe(parentId);
	expect(joined.child_id).toBe(childId);
	expect(joined.change_id).toBe(commitChangeId);
	expect(joined.change_entity_id).toBe(childId);
	expect(joined.snap).toMatchObject({
		id: childId,
		change_set_id: changeSetId,
		parent_commit_ids: [parentId],
	});
});

test("commit caching materializes its change set in cache", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, bootstrap: true },
			},
		],
	});

	const now = await getTimestamp({ lix });
	const parentId = "cs-parent";
	const childId = "cs-child";
	const changeSetId = "cs-materialized";
	const commitChangeId = "cs-commit-change";

	// Insert real commit change
	await lix.db
		.insertInto("change")
		.values({
			id: commitChangeId,
			entity_id: childId,
			schema_key: "lix_commit",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: {
				id: childId,
				change_set_id: changeSetId,
				parent_commit_ids: [parentId],
			},
			created_at: now,
		})
		.execute();

	// Push to cache so commit edges + change set are materialized
	updateStateCache({
		engine: lix.engine!,
		version_id: "global",
		commit_id: childId,
		changes: [
			{
				id: commitChangeId,
				entity_id: childId,
				schema_key: "lix_commit",
				schema_version: "1.0",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					id: childId,
					change_set_id: changeSetId,
					parent_commit_ids: [parentId],
				}),
				created_at: now,
			},
		],
	});

	// Verify the change set appears via the cache in change_set_all
	const cs = await lix.db
		.selectFrom("change_set_all")
		.where("id", "=", changeSetId)
		.where("lixcol_version_id", "=", "global")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(cs).toMatchObject({ id: changeSetId, lixcol_version_id: "global" });
});

// Edges caching from commit.parent_commit_ids
test("caches commit edges from commit.parent_commit_ids", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_untracked: true,
				lixcol_version_id: "global",
			},
		],
	});

	const now = await getTimestamp({ lix });
	const parentId = "commit-parent";
	const childId = "commit-child";
	const changeSetId = "cs-merge";

	updateStateCache({
		engine: lix.engine!,
		version_id: "global",
		commit_id: "global-commit-edges-1",
		changes: [
			{
				id: "chg-commit-with-parents",
				entity_id: childId,
				schema_key: "lix_commit",
				schema_version: "1.0",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					id: childId,
					change_set_id: changeSetId,
					parent_commit_ids: [parentId],
				}),
				created_at: now,
			},
		],
	});

	const edges = await lix.db
		.selectFrom("commit_edge_all")
		.where("lixcol_version_id", "=", "global")
		.where("parent_id", "=", parentId)
		.where("child_id", "=", childId)
		.selectAll()
		.execute();

	expect(edges).toHaveLength(1);
	expect(edges[0]).toMatchObject({
		parent_id: parentId,
		child_id: childId,
		lixcol_version_id: "global",
	});
});

test("clears cached edges when parent_commit_ids becomes empty", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_untracked: true,
				lixcol_version_id: "global",
			},
		],
	});

	const now = await getTimestamp({ lix });
	const parentId = "commit-parent-2";
	const childId = "commit-child-2";
	const changeSetId = "cs-merge-2";

	// Seed with a commit which has a parent
	updateStateCache({
		engine: lix.engine!,
		version_id: "global",
		commit_id: "global-commit-edges-2",
		changes: [
			{
				id: "chg-commit-with-parents-2",
				entity_id: childId,
				schema_key: "lix_commit",
				schema_version: "1.0",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					id: childId,
					change_set_id: changeSetId,
					parent_commit_ids: [parentId],
				}),
				created_at: now,
			},
		],
	});

	// Sanity check exists
	const before = await lix.db
		.selectFrom("commit_edge_all")
		.where("lixcol_version_id", "=", "global")
		.where("child_id", "=", childId)
		.selectAll()
		.execute();
	expect(before.length).toBeGreaterThan(0);

	// Update commit with empty parents
	updateStateCache({
		engine: lix.engine!,
		version_id: "global",
		commit_id: "global-commit-edges-3",
		changes: [
			{
				id: "chg-commit-without-parents-2",
				entity_id: childId,
				schema_key: "lix_commit",
				schema_version: "1.0",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					id: childId,
					change_set_id: changeSetId,
					parent_commit_ids: [],
				}),
				created_at: now,
			},
		],
	});

	const after = await lix.db
		.selectFrom("commit_edge_all")
		.where("lixcol_version_id", "=", "global")
		.where("child_id", "=", childId)
		.selectAll()
		.execute();
	expect(after).toEqual([]);
});
