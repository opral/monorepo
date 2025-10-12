import { expect, test } from "vitest";
import { sql } from "kysely";
import { selectFromStateCacheV2 } from "./select-from-state-cache.js";

const VERSION = "1.0";

test("routes to the physical cache table for the provided schema key", () => {
	const compiled = selectFromStateCacheV2("lix_change_set", VERSION)
		.selectAll()
		.compile();

	expect(compiled.sql).toContain(
		"lix_internal_state_cache_lix_change_set_v1_0"
	);
});

test("exposes normalized lixcol metadata columns", () => {
	const compiled = selectFromStateCacheV2("lix_change_set", VERSION)
		.select(["lixcol_entity_id", "lixcol_is_tombstone"])
		.compile();

	expect(compiled.sql).toContain('"lixcol_entity_id"');
	expect(compiled.sql).toContain('"lixcol_is_tombstone"');
});

test("uses the internal query builder so callers can chain Kysely clauses", () => {
	const compiled = selectFromStateCacheV2("lix_change_set", VERSION)
		.where("lixcol_schema_key", "=", "lix_change_set")
		.where("lixcol_version_id", "=", "global")
		.select(["lixcol_entity_id"])
		.compile();

	expect(compiled.sql).toMatch(/WHERE\s+"lixcol_schema_key"\s*=\s*\?/i);
	expect(compiled.sql).toMatch(/"lixcol_version_id"\s*=\s*\?/i);
	expect(compiled.parameters).toEqual(["lix_change_set", "global"]);
});

test("supports Kysely unions between independent cache builders", () => {
	const unionQuery = selectFromStateCacheV2("lix_change_set", VERSION)
		.select(["lixcol_entity_id"])
		.unionAll(
			selectFromStateCacheV2("lix_commit", VERSION).select(["lixcol_entity_id"])
		);

	const compiled = unionQuery.compile();
	expect(compiled.sql).toContain(
		"lix_internal_state_cache_lix_change_set_v1_0"
	);
	expect(compiled.sql).toContain("lix_internal_state_cache_lix_commit_v1_0");
	expect(compiled.sql).toMatch(/union all/i);
});

test("supports standard joins for advanced routing queries", () => {
	const compiled = selectFromStateCacheV2("lix_change_set", VERSION)
		.innerJoin(
			sql`lix_internal_state_cache_lix_commit_v1_0`.as("commit_cache"),
			(join) =>
				join.onRef(
					"lix_internal_state_cache_routed.lixcol_entity_id",
					"=",
					"commit_cache.lixcol_entity_id"
				)
		)
		.select([
			"lix_internal_state_cache_routed.lixcol_entity_id",
			"commit_cache.lixcol_entity_id",
		])
		.compile();

	expect(compiled.sql).toMatch(
		/inner join\s+lix_internal_state_cache_lix_commit_v1_0\s+as\s+"commit_cache"/i
	);
	expect(compiled.sql).toMatch(
		/"lix_internal_state_cache_routed"\."lixcol_entity_id"/
	);
});

test("returns an empty select when no schema key is provided", () => {
	const compiled = selectFromStateCacheV2().selectAll().compile();

	expect(compiled.sql).toMatch(/WHERE\s+0/);
});
