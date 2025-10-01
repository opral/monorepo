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

test("rewrites every internal_state_vtable reference", () => {
	const sql = `SELECT * FROM internal_state_vtable v
	UNION ALL
	SELECT * FROM internal_state_vtable w WHERE w.schema_key = 'lix_key_value';`;

	const rewritten = rewriteSql(sql);

	expect(rewritten).not.toMatch(/FROM\s+internal_state_vtable\b/i);
	expect(rewritten).toContain("AS v");
	expect(rewritten).toContain("AS w");
});

test("rewrites state_all view body", () => {
	const sql = `SELECT
	  entity_id,
	  schema_key,
	  file_id,
	  version_id,
	  plugin_key,
	  snapshot_content,
	  schema_version,
	  created_at,
	  updated_at,
	  inherited_from_version_id,
	  change_id,
	  untracked,
	  commit_id,
	  writer_key,
	  (
	    SELECT json(metadata)
	    FROM change
	    WHERE change.id = internal_state_vtable.change_id
	  ) AS metadata
FROM internal_state_vtable
WHERE snapshot_content IS NOT NULL;`;

	const rewritten = rewriteSql(sql);

	expect(rewritten).not.toMatch(/FROM\s+internal_state_vtable\b/i);
	expect(rewritten).toContain("AS internal_state_vtable");
	expect(rewritten).toContain("SELECT json(metadata)");
	expect(rewritten).toContain("FROM change");
});

test("rewrites active_version view body proxying through state_all", () => {
	const sql = `SELECT
	  json_extract(snapshot_content, '$.version_id') AS version_id,
	  inherited_from_version_id AS lixcol_inherited_from_version_id,
	  created_at AS lixcol_created_at,
	  updated_at AS lixcol_updated_at,
	  file_id AS lixcol_file_id,
	  change_id AS lixcol_change_id,
	  untracked AS lixcol_untracked
FROM internal_state_vtable
WHERE schema_key = 'lix_active_version'
  AND version_id = 'global';`;

	const rewritten = rewriteSql(sql);

	expect(rewritten).not.toMatch(/FROM\s+internal_state_vtable\b/i);
	expect(rewritten).toContain("AS internal_state_vtable");
	expect(rewritten).toContain("WHERE schema_key = 'lix_active_version'");
});
