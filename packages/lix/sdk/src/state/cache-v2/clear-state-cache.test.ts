import { test, expect } from "vitest";
import { clearStateCacheV2 } from "./clear-state-cache.js";
import { isStaleStateCacheV2 } from "./is-stale-state-cache.js";
import { markStateCacheAsFreshV2 } from "./mark-state-cache-as-stale.js";
import {
	createSchemaCacheTableV2,
	schemaKeyToCacheTableNameV2,
} from "./create-schema-cache-table.js";
import { updateStateCacheV2 } from "./update-state-cache.js";
import { openLix } from "../../lix/open-lix.js";

test("clearStateCacheV2 deletes all cache entries", async () => {
	const lix = await openLix({});
	// Insert some data to populate cache
	await lix.db
		.insertInto("key_value")
		.values({
			key: "test_key",
			value: "test_value",
		})
		.execute();

	const schemaKey = "clear_state_schema";
	const schema = {
		$schema: "http://json-schema.org/draft-07/schema#",
		type: "object",
		additionalProperties: false,
		properties: {
			value: { type: "string" },
		},
		"x-lix-key": schemaKey,
		"x-lix-version": "1.0",
	} as const;

	const tableName = schemaKeyToCacheTableNameV2(schemaKey, "1.0");
	createSchemaCacheTableV2({
		engine: lix.engine!,
		schema,
		tableName,
	});

	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	updateStateCacheV2({
		engine: lix.engine!,
		changes: [
			{
				id: "change-value-1",
				entity_id: "value-1",
				schema_key: schemaKey,
				schema_version: "1.0",
				file_id: "lix",
				plugin_key: "lix_sdk",
				snapshot_content: JSON.stringify({ value: "cached" }),
				created_at: "2024-01-01T00:00:00Z",
			},
		],
		commit_id: "commit-value-1",
		version_id: "global",
	});

	// Verify cache has entries in v2 tables
	const cacheTables = lix.engine!.sqlite.exec({
		sql: `SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE 'lix_internal_state_cache_v2_%'`,
		returnValue: "resultRows",
	}) as Array<[string]>;

	expect(cacheTables.length).toBeGreaterThan(0);

	for (const [tableName] of cacheTables) {
		const before = lix.engine!.sqlite.exec({
			sql: `SELECT COUNT(*) AS cnt FROM ${tableName}`,
			returnValue: "resultRows",
			rowMode: "object",
		}) as Array<{ cnt: number }>;
		expect(Number(before?.[0]?.cnt ?? 0)).toBeGreaterThan(0);
	}

	// Ensure the stale flag is false and cached before we clear it
	markStateCacheAsFreshV2({ engine: lix.engine! });
	expect(isStaleStateCacheV2({ engine: lix.engine! })).toBe(false);

	// Clear the cache
	clearStateCacheV2({ engine: lix.engine! });

	// Verify cache is empty
	for (const [tableName] of cacheTables) {
		const after = lix.engine!.sqlite.exec({
			sql: `SELECT COUNT(*) AS cnt FROM ${tableName}`,
			returnValue: "resultRows",
			rowMode: "object",
		}) as Array<{ cnt: number }>;
		expect(Number(after?.[0]?.cnt ?? 0)).toBe(0);
	}

	// Verify the cache is marked as stale
	const isStale = isStaleStateCacheV2({
		engine: lix.engine!,
	});
	expect(isStale).toBe(true);
});
