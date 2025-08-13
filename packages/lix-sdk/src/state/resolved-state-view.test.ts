import { test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { sql, type Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import { serializeStatePk, parseStatePk } from "./primary-key.js";
import { timestamp } from "../deterministic/timestamp.js";

test("resolved state view should return same results as state_all for a tracked entity", async () => {
	const lix = await openLix({});

	const lixInternalDb = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Insert a key-value through the normal state API
	await lix.db
		.insertInto("key_value")
		.values({
			key: "test-key",
			value: "test-value",
		})
		.execute();

	// Query both state_all and underlying_state
	const stateAllResults = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "test-key")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		// @ts-expect-error - internal state_all has a hidden _pk column
		.select("_pk")
		.execute();

	const resolvedStateResults = await lixInternalDb
		.selectFrom("internal_resolved_state_all")
		.where("entity_id", "=", "test-key")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.execute();

	expect(stateAllResults).toEqual(resolvedStateResults);
});

test("resolved state view should return same results as state_all for an untracked entity", async () => {
	const lix = await openLix({});

	const lixInternalDb = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Insert an untracked key-value directly
	await lix.db
		.insertInto("key_value")
		.values({
			key: "cache_stale",
			value: "true",
			lixcol_untracked: true,
		})
		.execute();

	// Query both state_all and underlying_state
	const stateAllResults = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "cache_stale")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		// @ts-expect-error - internal state_all has a hidden _pk column
		.select("_pk")
		.execute();

	const resolvedStateResults = await lixInternalDb
		.selectFrom("internal_resolved_state_all")
		.where("entity_id", "=", "cache_stale")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.execute();

	expect(stateAllResults).toEqual(resolvedStateResults);

	// Verify it's marked as untracked
	expect(stateAllResults[0]?.untracked).toBe(1);
	expect(resolvedStateResults[0]?.untracked).toBe(1);
});

test("resolved state view should handle version inheritance", async () => {
	const lix = await openLix({});

	const lixInternalDb = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Get the active version (which inherits from global)
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirst();

	// Insert key-value directly into key_value_all with global version
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "inherited-key",
			value: "global-value",
			lixcol_version_id: "global",
		})
		.execute();

	// Query both state_all and underlying_state for active version
	const stateAllResults = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "inherited-key")
		.where("version_id", "=", activeVersion!.version_id)
		.selectAll()
		// @ts-expect-error - internal state_all has a hidden _pk column
		.select("_pk")
		.execute();

	const resolvedStateResults = await lixInternalDb
		.selectFrom("internal_resolved_state_all")
		.where("entity_id", "=", "inherited-key")
		.where("version_id", "=", activeVersion!.version_id)
		.selectAll()
		.execute();

	// Both should return the inherited entity
	expect(stateAllResults).toHaveLength(1);
	expect(resolvedStateResults).toHaveLength(1);

	// Results should match
	expect(stateAllResults).toEqual(resolvedStateResults);

	// Verify it's marked as inherited from global
	expect(stateAllResults[0]?.inherited_from_version_id).toBe("global");
	expect(resolvedStateResults[0]?.inherited_from_version_id).toBe("global");
});

test("resolved state view should handle inherited untracked entities", async () => {
	const lix = await openLix({});

	const lixInternalDb = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Get the active version (which inherits from global)
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirst();

	// Insert untracked key-value directly into key_value_all with global version
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "inherited-untracked-key",
			value: "global-untracked-value",
			lixcol_version_id: "global",
			lixcol_untracked: true,
		})
		.execute();

	// Query both state_all and underlying_state for active version
	const stateAllResults = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "inherited-untracked-key")
		.where("version_id", "=", activeVersion!.version_id)
		// @ts-expect-error - internal state_all has a hidden _pk column
		.select("_pk")
		.selectAll()
		.execute();

	const resolvedStateResults = await lixInternalDb
		.selectFrom("internal_resolved_state_all")
		.where("entity_id", "=", "inherited-untracked-key")
		.where("version_id", "=", activeVersion!.version_id)
		.selectAll()
		.execute();

	// Both should return the inherited untracked entity
	expect(stateAllResults).toHaveLength(1);
	expect(resolvedStateResults).toHaveLength(1);

	// Results should match
	expect(stateAllResults).toEqual(resolvedStateResults);

	// Verify it's marked as inherited from global and untracked
	expect(stateAllResults[0]?.inherited_from_version_id).toBe("global");
	expect(resolvedStateResults[0]?.inherited_from_version_id).toBe("global");
	expect(stateAllResults[0]?.untracked).toBe(1);
	expect(resolvedStateResults[0]?.untracked).toBe(1);
});

test.skip("underlying_state view should block inheritance when child has own value", async () => {
	const lix = await openLix({});

	const lixInternalDb = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Get the active version (which inherits from global)
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirst();

	// Insert key-value in global version (parent)
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "overridden-key",
			value: "global-value",
			lixcol_version_id: "global",
		})
		.execute();

	// Insert same key in active version (child) - this should block inheritance
	await lix.db
		.insertInto("key_value")
		.values({
			key: "overridden-key",
			value: "child-value",
		})
		.execute();

	// Query both state_all and underlying_state for active version
	const stateAllResults = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "overridden-key")
		.where("version_id", "=", activeVersion!.version_id)
		.selectAll()
		.execute();

	const underlyingStateResults = await lixInternalDb
		.selectFrom("internal_resolved_state_all")
		.where("entity_id", "=", "overridden-key")
		.where("version_id", "=", activeVersion!.version_id)
		.selectAll()
		.execute();

	// Both should return only the child's value
	expect(stateAllResults).toHaveLength(1);
	expect(underlyingStateResults).toHaveLength(1);

	// Results should match
	expect(stateAllResults).toEqual(underlyingStateResults);

	// Verify it's NOT inherited and has child value
	expect(stateAllResults[0]?.inherited_from_version_id).toBe(null);
	expect(underlyingStateResults[0]?.inherited_from_version_id).toBe(null);
	const stateSnapshot =
		typeof stateAllResults[0]?.snapshot_content === "string"
			? JSON.parse(stateAllResults[0].snapshot_content)
			: stateAllResults[0]?.snapshot_content;
	const underlyingSnapshot =
		typeof underlyingStateResults[0]?.snapshot_content === "string"
			? JSON.parse(underlyingStateResults[0].snapshot_content)
			: underlyingStateResults[0]?.snapshot_content;

	expect(stateSnapshot?.value).toBe("child-value");
	expect(underlyingSnapshot?.value).toBe("child-value");
});

test("resolved state view generates correct composite keys", async () => {
	const lix = await openLix({});
	const lixInternalDb = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Import updateStateCacheV2 at the top of the test
	const { updateStateCacheV2 } = await import("./cache/update-state-cache.js");

	// Insert some test data into untracked state
	const now = timestamp({ lix });
	await lixInternalDb
		.insertInto("internal_state_all_untracked")
		.values({
			entity_id: "entity1",
			schema_key: "test_schema",
			file_id: "file1",
			plugin_key: "test_plugin",
			snapshot_content: sql`jsonb(${JSON.stringify({ test: "data" })})`,
			schema_version: "1.0",
			version_id: "version1",
			created_at: now,
			updated_at: now,
			inherited_from_version_id: null,
			inheritance_delete_marker: 0,
		})
		.execute();

	// Insert some test data into state cache using updateStateCacheV2
	updateStateCacheV2({
		lix,
		changes: [
			{
				id: "change1",
				entity_id: "entity2",
				file_id: "file2",
				schema_key: "test_schema",
				plugin_key: "test_plugin",
				snapshot_content: JSON.stringify({ test: "data2" }),
				schema_version: "1.0",
				created_at: timestamp({ lix }),
			},
		],
		commit_id: "changeset1",
		version_id: "version2",
	});

	// Query the resolved state view
	const results = await lixInternalDb
		.selectFrom("internal_resolved_state_all")
		.select([
			"_pk",
			"entity_id",
			"file_id",
			"version_id",
			"untracked",
			"inherited_from_version_id",
		])
		.where("schema_key", "=", "test_schema")
		.orderBy("entity_id")
		.execute();

	expect(results).toHaveLength(2);

	// Check untracked entry
	const result1 = results[0]!;
	expect(result1.entity_id).toBe("entity1");
	expect(result1.file_id).toBe("file1");
	expect(result1.version_id).toBe("version1");
	expect(result1.untracked).toBe(1);
	expect(result1.inherited_from_version_id).toBe(null);

	// Verify primary key matches serializePk
	const expectedKey1 = serializeStatePk(
		"U",
		result1.file_id,
		result1.entity_id,
		result1.version_id
	);
	expect(result1._pk).toBe(expectedKey1);

	// Parse and verify
	const parsed1 = parseStatePk(result1._pk);
	expect(parsed1).toEqual({
		tag: "U",
		fileId: "file1",
		entityId: "entity1",
		versionId: "version1",
	});

	// Check cached entry
	const result2 = results[1]!;
	expect(result2.entity_id).toBe("entity2");
	expect(result2.file_id).toBe("file2");
	expect(result2.version_id).toBe("version2");
	expect(result2.untracked).toBe(0);
	expect(result2.inherited_from_version_id).toBe(null);

	// Verify primary key matches serializePk
	const expectedKey2 = serializeStatePk(
		"C",
		result2.file_id,
		result2.entity_id,
		result2.version_id
	);
	expect(result2._pk).toBe(expectedKey2);

	// Parse and verify
	const parsed2 = parseStatePk(result2._pk);
	expect(parsed2).toEqual({
		tag: "C",
		fileId: "file2",
		entityId: "entity2",
		versionId: "version2",
	});
});

test("resolved state view generates correct composite keys for inherited state", async () => {
	const lix = await openLix({});
	const lixInternalDb = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Import updateStateCacheV2 at the top of the test
	const { updateStateCacheV2 } = await import("./cache/update-state-cache.js");

	// Create parent and child versions
	const parentVersionId = "parent_version";
	const childVersionId = "child_version";

	// Insert version records using updateStateCacheV2
	const versionTimestamp = timestamp({ lix });
	updateStateCacheV2({
		lix,
		changes: [
			{
				id: "change1",
				entity_id: parentVersionId,
				schema_key: "lix_version",
				file_id: "lix",
				plugin_key: "lix",
				snapshot_content: JSON.stringify({ id: parentVersionId }),
				schema_version: "1.0",
				created_at: versionTimestamp,
			},
			{
				id: "change2",
				entity_id: childVersionId,
				schema_key: "lix_version",
				file_id: "lix",
				plugin_key: "lix",
				snapshot_content: JSON.stringify({
					id: childVersionId,
					inherits_from_version_id: parentVersionId,
				}),
				schema_version: "1.0",
				created_at: versionTimestamp,
			},
		],
		commit_id: "changeset1",
		version_id: "global",
	});

	// Insert data in parent version (cached) using updateStateCacheV2
	updateStateCacheV2({
		lix,
		changes: [
			{
				id: "change3",
				entity_id: "inherited_entity",
				schema_key: "test_schema",
				file_id: "file3",
				plugin_key: "test_plugin",
				snapshot_content: JSON.stringify({ test: "inherited_data" }),
				schema_version: "1.0",
				created_at: timestamp({ lix }),
			},
		],
		commit_id: "changeset3",
		version_id: parentVersionId,
	});

	// Insert data in parent version (untracked)
	const untrackedTimestamp = timestamp({ lix });
	await lixInternalDb
		.insertInto("internal_state_all_untracked")
		.values({
			entity_id: "inherited_untracked",
			schema_key: "test_schema",
			file_id: "file4",
			plugin_key: "test_plugin",
			snapshot_content: sql`jsonb(${JSON.stringify({ test: "inherited_untracked_data" })})`,
			schema_version: "1.0",
			version_id: parentVersionId,
			created_at: untrackedTimestamp,
			updated_at: untrackedTimestamp,
			inherited_from_version_id: null,
			inheritance_delete_marker: 0,
		})
		.execute();

	// Query the resolved state for child version
	const results = await lixInternalDb
		.selectFrom("internal_resolved_state_all")
		.select([
			"_pk",
			"entity_id",
			"file_id",
			"version_id",
			"untracked",
			"inherited_from_version_id",
		])
		.where("schema_key", "=", "test_schema")
		.where("version_id", "=", childVersionId)
		.orderBy("entity_id")
		.execute();

	expect(results).toHaveLength(2);

	// Check inherited cached entry
	const result1 = results[0]!;
	expect(result1.entity_id).toBe("inherited_entity");
	expect(result1.file_id).toBe("file3");
	expect(result1.version_id).toBe(childVersionId); // Should show child version
	expect(result1.untracked).toBe(0);
	expect(result1.inherited_from_version_id).toBe(parentVersionId);

	// Verify primary key for inherited cached state
	const expectedKey1 = serializeStatePk(
		"CI",
		result1.file_id,
		result1.entity_id,
		result1.version_id
	);
	expect(result1._pk).toBe(expectedKey1);

	// Parse and verify
	const parsed1 = parseStatePk(result1._pk);
	expect(parsed1).toEqual({
		tag: "CI",
		fileId: "file3",
		entityId: "inherited_entity",
		versionId: childVersionId,
	});

	// Check inherited untracked entry
	const result2 = results[1]!;
	expect(result2.entity_id).toBe("inherited_untracked");
	expect(result2.file_id).toBe("file4");
	expect(result2.version_id).toBe(childVersionId); // Should show child version
	expect(result2.untracked).toBe(1);
	expect(result2.inherited_from_version_id).toBe(parentVersionId);

	// Verify primary key for inherited untracked state
	const expectedKey2 = serializeStatePk(
		"UI",
		result2.file_id,
		result2.entity_id,
		result2.version_id
	);
	expect(result2._pk).toBe(expectedKey2);

	// Parse and verify
	const parsed2 = parseStatePk(result2._pk);
	expect(parsed2).toEqual({
		tag: "UI",
		fileId: "file4",
		entityId: "inherited_untracked",
		versionId: childVersionId,
	});
});
