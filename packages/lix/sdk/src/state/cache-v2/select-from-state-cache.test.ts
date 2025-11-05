import { expect, test } from "vitest";
import { sql } from "kysely";
import { selectFromStateCacheV2 } from "./select-from-state-cache.js";
import { registerStateCacheSchemaProperties } from "./schema-metadata.js";

const VERSION = "1.0";

test("routes to the physical cache table for the provided schema key", () => {
	const compiled = selectFromStateCacheV2("lix_change_set", VERSION)
		.selectAll()
		.compile();

	expect(compiled.sql).toContain(
		"lix_internal_state_cache_v2_lix_change_set_v1_0"
	);
});

test("exposes normalized metadata columns", () => {
	const compiled = selectFromStateCacheV2("lix_change_set", VERSION)
		.select(["entity_id", "is_tombstone"])
		.compile();

	expect(compiled.sql).toContain('"entity_id"');
	expect(compiled.sql).toContain('"is_tombstone"');
});

test("provides a virtual snapshot_content column", () => {
	const schemaKey = "test_cache_snapshot";
	registerStateCacheSchemaProperties({
		schemaKey,
		schemaVersion: VERSION,
		properties: [
			{ propertyName: "example", columnName: "x_example", valueKind: "string" },
			{ propertyName: "flag", columnName: "x_flag", valueKind: "boolean" },
		],
	});

	const compiled = selectFromStateCacheV2(schemaKey, VERSION)
		.select(["snapshot_content"])
		.compile();

	expect(compiled.sql).toMatch(
		/CASE\s+WHEN\s+"is_tombstone"\s*=\s*1\s+THEN\s+NULL\s+ELSE\s+json_object/i
	);
	expect(compiled.sql).toContain("json_object('example'");
	expect(compiled.sql).toContain('json_quote("x_example")');
	expect(compiled.sql).toContain(
		'CASE WHEN "x_flag" IS NULL THEN NULL WHEN "x_flag" = 1 THEN json(\'true\')'
	);
	expect(compiled.sql).toContain('AS "snapshot_content"');
});

test("uses the internal query builder so callers can chain Kysely clauses", () => {
	const compiled = selectFromStateCacheV2("lix_change_set", VERSION)
		.where("schema_key", "=", "lix_change_set")
		.where("version_id", "=", "global")
		.select(["entity_id"])
		.compile();

	expect(compiled.sql).toMatch(/WHERE\s+"schema_key"\s*=\s*\?/i);
	expect(compiled.sql).toMatch(/"version_id"\s*=\s*\?/i);
	expect(compiled.parameters).toEqual(["lix_change_set", "global"]);
});

test("supports Kysely unions between independent cache builders", () => {
	const unionQuery = selectFromStateCacheV2("lix_change_set", VERSION)
		.select(["entity_id"])
		.unionAll(
			selectFromStateCacheV2("lix_commit", VERSION).select(["entity_id"])
		);

	const compiled = unionQuery.compile();
	expect(compiled.sql).toContain(
		"lix_internal_state_cache_v2_lix_change_set_v1_0"
	);
	expect(compiled.sql).toContain("lix_internal_state_cache_v2_lix_commit_v1_0");
	expect(compiled.sql).toMatch(/union all/i);
});

test("supports standard joins for advanced routing queries", () => {
	const compiled = selectFromStateCacheV2("lix_change_set", VERSION)
		.innerJoin(
			sql`lix_internal_state_cache_v2_lix_commit_v1_0`.as("commit_cache"),
			(join) =>
				join.onRef(
					"lix_internal_state_cache_routed.entity_id",
					"=",
					"commit_cache.entity_id"
				)
		)
		.select([
			"lix_internal_state_cache_routed.entity_id",
			"commit_cache.entity_id",
		])
		.compile();

	expect(compiled.sql).toMatch(
		/inner join\s+lix_internal_state_cache_v2_lix_commit_v1_0\s+as\s+"commit_cache"/i
	);
	expect(compiled.sql).toMatch(
		/"lix_internal_state_cache_routed"\."entity_id"/
	);
});

test("returns an empty select when no schema key is provided", () => {
	const compiled = selectFromStateCacheV2().selectAll().compile();

	expect(compiled.sql).toMatch(/WHERE\s+0/);
});
