import { expect, test } from "vitest";
import { SqliteQueryCompiler } from "kysely";
import { internalQueryBuilder } from "../../internal-query-builder.js";
import { rewriteStateAllView } from "./state-all.js";

const compiler = new SqliteQueryCompiler();

test("rewrites state_all to resolved state with cache tables", () => {
	const original = internalQueryBuilder
		.selectFrom("state_all as sa")
		.selectAll()
		.where("sa.schema_key", "=", "lix_key_value")
		.compile();

	const rewritten = rewriteStateAllView(original.query);
	expect(rewritten).not.toBe(original.query);

	const sqlText = compiler.compileQuery(rewritten, original.queryId).sql;

	expect(sqlText).toMatch(/internal_state_cache_lix_key_value/i);
	expect(sqlText).toMatch(/internal_state_cache_lix_version_descriptor/i);
	expect(sqlText).toMatch(/snapshot_content/);
	expect(sqlText).not.toMatch(/FROM\s+"?state_all(?!_)/i);
});

test("leaves query untouched when no state_all present", () => {
	const original = internalQueryBuilder
		.selectFrom("key_value")
		.selectAll()
		.compile();

	const rewritten = rewriteStateAllView(original.query);
	expect(rewritten).toBe(original.query);
});
