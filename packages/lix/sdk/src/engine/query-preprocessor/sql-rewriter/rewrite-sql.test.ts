import { expect, test, vi } from "vitest";
import { rewriteSql } from "./rewrite-sql.js";
import * as tokenizer from "./tokenizer.js";

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

test("reuses provided tokens when supplied", () => {
	const sql = `SELECT * FROM internal_state_vtable AS t WHERE t.schema_key = 'lix_key_value' LIMIT 1;`;
	const tokens = tokenizer.tokenize(sql);
	const spy = vi.spyOn(tokenizer, "tokenize");

	const rewritten = rewriteSql(sql, { tokens });

	expect(spy).not.toHaveBeenCalled();
	expect(rewritten).toContain("LIMIT 1");
	spy.mockRestore();
});
