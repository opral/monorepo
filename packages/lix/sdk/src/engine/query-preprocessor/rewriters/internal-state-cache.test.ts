import { expect, test } from "vitest";
import { SqliteQueryCompiler } from "kysely";
import { internalQueryBuilder } from "../../internal-query-builder.js";
import { rewriteInternalStateCache } from "./internal-state-cache.js";

test("rewrites internal_state_cache reads to the schema-specific table", () => {
	const original = internalQueryBuilder
		.selectFrom("internal_state_cache as isc")
		.selectAll()
		.where("isc.schema_key", "=", "lix_key_value")
		.compile();

	const rewritten = rewriteInternalStateCache(original.query);

	expect(rewritten).not.toBe(original.query);

	const compiled = new SqliteQueryCompiler().compileQuery(
		rewritten,
		original.queryId
	);

	expect(compiled.sql).toContain("internal_state_cache_lix_key_value");
	expect(compiled.sql).not.toMatch(/internal_state_cache(?!_)/);
});

test("returns the original query when no schema filter is present", () => {
	const original = internalQueryBuilder
		.selectFrom("internal_state_cache")
		.selectAll()
		.compile();

	const rewritten = rewriteInternalStateCache(original.query);

	expect(rewritten).toBe(original.query);
});
