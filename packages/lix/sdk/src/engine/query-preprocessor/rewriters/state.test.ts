import { expect, test } from "vitest";
import { SqliteQueryCompiler } from "kysely";
import { internalQueryBuilder } from "../../internal-query-builder.js";
import { rewriteStateView } from "./state.js";

const COMPILER = new SqliteQueryCompiler();

test("rewrites state view to resolved state with active version filter", () => {
	const original = internalQueryBuilder
		.selectFrom("state as s")
		.selectAll()
		.where("s.schema_key", "=", "lix_key_value")
		.compile();

	const rewritten = rewriteStateView(original.query);

	expect(rewritten).not.toBe(original.query);

	const sqlText = COMPILER.compileQuery(rewritten, original.queryId).sql;

	expect(sqlText).toMatch(/internal_state_cache_lix_key_value/i);
	expect(sqlText).toMatch(/internal_state_cache_lix_version_descriptor/i);
	expect(sqlText).not.toMatch(/FROM\s+"?state(?!_)/i);
	expect(sqlText).not.toMatch(/FROM\s+"?active_version"?/i);
	expect(sqlText).not.toMatch(/internal_state_vtable/i);
});

test("returns original node when source is not state", () => {
	const original = internalQueryBuilder
		.selectFrom("state_all")
		.selectAll()
		.compile();

	const rewritten = rewriteStateView(original.query);

	expect(rewritten).toBe(original.query);
});
