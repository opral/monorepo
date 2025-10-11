import { expect, test } from "vitest";
import { sql } from "kysely";
import { selectFromStateCache } from "./select-from-state-cache.js";

test("routes to the physical cache table for the provided schema key", () => {
	const compiled = selectFromStateCache("lix_change_set").selectAll().compile();

	expect(compiled.sql).toContain("lix_internal_state_cache_lix_change_set");
});

test("exposes raw cache columns including snapshot content", () => {
	const compiled = selectFromStateCache("lix_change_set")
		.select(["entity_id", "snapshot_content"])
		.compile();

	expect(compiled.sql).toContain('"entity_id"');
	expect(compiled.sql).toContain('"snapshot_content"');
});

test("uses the internal query builder so callers can chain Kysely clauses", () => {
	const compiled = selectFromStateCache("lix_change_set")
		.where("schema_key", "=", "lix_change_set")
		.where("version_id", "=", "global")
		.select(["entity_id"])
		.compile();

	expect(compiled.sql).toMatch(/WHERE\s+"schema_key"\s*=\s*\?/i);
	expect(compiled.sql).toMatch(/"version_id"\s*=\s*\?/i);
	expect(compiled.parameters).toEqual(["lix_change_set", "global"]);
});

test("supports Kysely unions between independent cache builders", () => {
	const unionQuery = selectFromStateCache("lix_change_set")
		.select(["entity_id"])
		.unionAll(selectFromStateCache("lix_commit").select(["entity_id"]));

	const compiled = unionQuery.compile();
	expect(compiled.sql).toContain("lix_internal_state_cache_lix_change_set");
	expect(compiled.sql).toContain("lix_internal_state_cache_lix_commit");
	expect(compiled.sql).toMatch(/union all/i);
});

test("supports standard joins for advanced routing queries", () => {
	const compiled = selectFromStateCache("lix_change_set")
		.innerJoin(
			sql`lix_internal_state_cache_lix_commit`.as("commit_cache"),
			(join) =>
				join.onRef(
					"lix_internal_state_cache_routed.entity_id",
					"=",
					"commit_cache.entity_id"
				)
		)
		.select(["lix_internal_state_cache_routed.entity_id", "commit_cache.entity_id"])
		.compile();

	expect(compiled.sql).toMatch(
		/inner join\s+lix_internal_state_cache_lix_commit\s+as\s+"commit_cache"/i
	);
	expect(compiled.sql).toMatch(/"lix_internal_state_cache_routed"\."entity_id"/);
});

test("returns an empty select when no schema key is provided", () => {
	const compiled = selectFromStateCache().selectAll().compile();

	expect(compiled.sql).toMatch(/WHERE\s+0/);
});
