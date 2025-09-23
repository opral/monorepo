import { expect, test } from "vitest";
import { sql } from "kysely";
import { selectFromStateCache } from "./select-from-state-cache.js";

test("routes to the physical cache table for the provided schema key", () => {
	const compiled = selectFromStateCache("lix_change_set").selectAll().compile();

	expect(compiled.sql).toContain("internal_state_cache_lix_change_set");
});

test("adds implicit lixcol_* projections matching entity views", () => {
	const compiled = selectFromStateCache("lix_change_set")
		.select(["lixcol_entity_id", "lixcol_version_id"])
		.compile();

	expect(compiled.sql).toContain('"lixcol_entity_id"');
	expect(compiled.sql).toContain('"lixcol_version_id"');
});

test("uses the internal query builder so callers can chain Kysely clauses", () => {
	const compiled = selectFromStateCache("lix_change_set")
		.where("schema_key", "=", "lix_change_set")
		.where("lixcol_version_id", "=", "global")
		.select(["entity_id"])
		.compile();

	expect(compiled.sql).toMatch(/WHERE\s+"schema_key"\s*=\s*\?/i);
	expect(compiled.sql).toMatch(/"lixcol_version_id"\s*=\s*\?/i);
	expect(compiled.parameters).toEqual(["lix_change_set", "global"]);
});

test("supports Kysely unions between independent cache builders", () => {
	const unionQuery = selectFromStateCache("lix_change_set")
		.select(["entity_id"])
		.unionAll(selectFromStateCache("lix_commit").select(["entity_id"]));

	const compiled = unionQuery.compile();
	expect(compiled.sql).toContain("internal_state_cache_lix_change_set");
	expect(compiled.sql).toContain("internal_state_cache_lix_commit");
	expect(compiled.sql).toMatch(/union all/i);
});

test("supports standard joins for advanced routing queries", () => {
	const compiled = selectFromStateCache("lix_change_set")
		.innerJoin(
			sql`internal_state_cache_lix_commit`.as("commit_cache"),
			(join) =>
				join.onRef(
					"internal_state_cache_routed.lixcol_entity_id",
					"=",
					"commit_cache.entity_id"
				)
		)
		.select([
			"internal_state_cache_routed.lixcol_entity_id",
			"commit_cache.entity_id",
		])
		.compile();

	expect(compiled.sql).toMatch(
		/inner join\s+internal_state_cache_lix_commit\s+as\s+"commit_cache"/i
	);
	expect(compiled.sql).toMatch(
		/"internal_state_cache_routed"\."lixcol_entity_id"/
	);
});

test("returns an empty select when no schema key is provided", () => {
	const compiled = selectFromStateCache().selectAll().compile();

	expect(compiled.sql).toMatch(/WHERE\s+0/);
});
