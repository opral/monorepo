import { expect, test } from "vitest";
import { SqliteQueryCompiler, type QueryId } from "kysely";
import { internalQueryBuilder } from "../../internal-query-builder.js";
import { rewriteInternalResolvedStateAll } from "./internal-resolved-state-all.js";

const COMPILER = new SqliteQueryCompiler();

function compile(node: any, queryId: QueryId) {
	return COMPILER.compileQuery(node, queryId).sql;
}

test("rewrites internal_resolved_state_all to inline physical cache tables", () => {
	const original = internalQueryBuilder
		.selectFrom("internal_resolved_state_all as rs")
		.selectAll()
		.where("rs.schema_key", "=", "lix_key_value")
		.compile();

	const rewritten = rewriteInternalResolvedStateAll(original.query);

	expect(rewritten).not.toBe(original.query);

	const sqlText = compile(rewritten, original.queryId);

	expect(sqlText).toContain("internal_state_cache_lix_key_value");
	expect(sqlText).toContain("internal_state_cache_lix_version_descriptor");
	expect(sqlText).not.toMatch(/internal_resolved_state_all(?!_)/);
});

test("returns original node when schema filter is absent", () => {
	const original = internalQueryBuilder
		.selectFrom("internal_resolved_state_all")
		.selectAll()
		.compile();

	const rewritten = rewriteInternalResolvedStateAll(original.query);

	expect(rewritten).toBe(original.query);
});
