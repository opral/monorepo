import { expect, test } from "vitest";
import { rewriteSql } from "./rewrite-sql.js";

test("rewrites top-level internal_state_vtable reference", () => {
	const sql = `SELECT * FROM internal_state_vtable;`;
	const rewritten = rewriteSql(sql);

	expect(rewritten).toContain("WITH RECURSIVE");
	expect(rewritten).toContain("AS internal_state_vtable");
	expect(rewritten).not.toContain("FROM internal_state_vtable;");
});

test("rewrites nested internal_state_vtable without touching outer query", () => {
	const sql = `SELECT sub.schema_key FROM (SELECT * FROM internal_state_vtable v WHERE v.schema_key = 'lix_key_value') sub WHERE sub.schema_key IS NOT NULL;`;

	const rewritten = rewriteSql(sql);

	expect(rewritten).toContain("WITH RECURSIVE");
	expect(rewritten).toContain("AS v");
	expect(rewritten).not.toContain("internal_state_vtable v");
	expect(rewritten.trim().endsWith("WHERE sub.schema_key IS NOT NULL;")).toBe(
		true
	);
});

test("uses fast replacement when limit 1 with literal schema key", () => {
	const sql = `SELECT sub.* FROM (SELECT * FROM internal_state_vtable v WHERE v.schema_key = 'lix_key_value' LIMIT 1) sub;`;
	const rewritten = rewriteSql(sql);

	expect(rewritten).toContain("LIMIT 1");
	expect(rewritten).toContain("internal_transaction_state");
	expect(rewritten).not.toContain("WITH RECURSIVE");
	expect(rewritten.trim().endsWith("sub;" )).toBe(true);
});
