import { expect, test } from "vitest";
import { rewriteSql } from "./rewrite-sql.js";
import * as tokenizer from "../../sql-parser/tokenizer.js";

test("rewrites top-level lix_internal_state_vtable reference", () => {
	const sql = `SELECT * FROM lix_internal_state_vtable;`;
	const rewritten = rewriteSql(sql);

	expect(rewritten).toContain("lix_internal_state_vtable_rewritten AS (");
	expect(rewritten).toContain(
		"lix_internal_state_cache_v1_lix_version_descriptor"
	);
	expect(rewritten).toContain(
		"(SELECT entity_id, schema_key, file_id, plugin_key, snapshot_content, schema_version, version_id, created_at, updated_at, inherited_from_version_id, change_id, untracked, commit_id, metadata, writer_key FROM lix_internal_state_vtable_rewritten) AS lix_internal_state_vtable"
	);
});

test("skips transaction segment when transaction flag false", () => {
	const sql = `SELECT * FROM lix_internal_state_vtable WHERE version_id = 'global';`;
	const rewritten = rewriteSql(sql, { hasOpenTransaction: false });

	expect(rewritten).not.toContain("lix_internal_transaction_state");
	expect(rewritten).toContain("lix_internal_state_all_untracked");
});

test("omits cache arms when no cache tables exist", () => {
	const sql = `SELECT * FROM lix_internal_state_vtable v WHERE v.schema_key = 'lix_key_value'`; // no trailing semicolon for ease of matching
	const rewritten = rewriteSql(sql, {
		existingCacheTables: new Set(),
	});

	expect(rewritten).not.toContain("lix_internal_state_cache_v1_lix_key_value");
	// Should still include other sources like untracked rows
	expect(rewritten).toContain("lix_internal_state_all_untracked");
	// Ensure cache-specific priorities are absent
	expect(rewritten).not.toContain("'CI' ||");
	expect(rewritten).not.toContain("'C' ||");
});

test("includes only known cache tables", () => {
	const sql = `SELECT * FROM lix_internal_state_vtable v WHERE v.schema_key IN ('lix_key_value', 'missing_schema')`;
	const rewritten = rewriteSql(sql, {
		existingCacheTables: new Set(["lix_internal_state_cache_v1_lix_key_value"]),
	});

	expect(rewritten).toContain("lix_internal_state_cache_v1_lix_key_value");
	expect(rewritten).not.toContain("lix_internal_state_cache_missing_schema");
});

test("rewrites nested lix_internal_state_vtable without touching outer query", () => {
	const sql = `SELECT sub.schema_key FROM (SELECT * FROM lix_internal_state_vtable v WHERE v.schema_key = 'lix_key_value') sub WHERE sub.schema_key IS NOT NULL;`;

	const rewritten = rewriteSql(sql);

	expect(rewritten.trim().startsWith("WITH")).toBe(true);
	expect(rewritten).toContain(
		"(SELECT entity_id, schema_key, file_id, plugin_key, snapshot_content, schema_version, version_id, created_at, updated_at, inherited_from_version_id, change_id, untracked, commit_id, metadata, writer_key FROM lix_internal_state_vtable_rewritten) AS v"
	);
	expect(rewritten.trim().endsWith("WHERE sub.schema_key IS NOT NULL;")).toBe(
		true
	);
});

test("precomputed tokens still produce a valid rewrite", () => {
	const sql = `SELECT * FROM lix_internal_state_vtable AS t WHERE t.schema_key = 'lix_key_value' LIMIT 1;`;
	const tokens = tokenizer.tokenize(sql);
	const rewritten = rewriteSql(sql, { tokens });

	expect(rewritten).toContain("lix_internal_state_vtable_rewritten");
	expect(rewritten).toContain("LIMIT 1");
});

test("rewrites every lix_internal_state_vtable reference", () => {
	const sql = `SELECT * FROM lix_internal_state_vtable v
	UNION ALL
	SELECT * FROM lix_internal_state_vtable w WHERE w.schema_key = 'lix_key_value';`;

	const rewritten = rewriteSql(sql);

	expect(rewritten).toContain("AS v");
	expect(rewritten).toContain("AS w");
	const projectionMatches = rewritten.match(
		/\(SELECT entity_id, schema_key, file_id, plugin_key, snapshot_content, schema_version, version_id, created_at, updated_at, inherited_from_version_id, change_id, untracked, commit_id, metadata, writer_key FROM lix_internal_state_vtable_rewritten\) AS [vw]/g
	);
	expect(projectionMatches?.length).toBe(2);
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
	    WHERE change.id = lix_internal_state_vtable.change_id
	  ) AS metadata
FROM lix_internal_state_vtable
WHERE snapshot_content IS NOT NULL;`;

	const rewritten = rewriteSql(sql);

	expect(rewritten).toContain("AS lix_internal_state_vtable");
	expect(rewritten).toContain("lix_internal_state_vtable_rewritten AS (");
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
FROM lix_internal_state_vtable
WHERE schema_key = 'lix_active_version'
  AND version_id = 'global';`;

	const rewritten = rewriteSql(sql);

	expect(rewritten).toContain("AS lix_internal_state_vtable");
	expect(rewritten).toContain("lix_internal_state_vtable_rewritten AS (");
	expect(rewritten).toContain("WHERE schema_key = 'lix_active_version'");
});

test("seeds version inheritance CTE when every reference filters by literal version", () => {
	const sql = `SELECT * FROM lix_internal_state_vtable WHERE version_id = 'global';`;
	const rewritten = rewriteSql(sql);

	expect(rewritten).toContain("params(version_id)");
	expect(rewritten).toContain("'global' AS version_id");
});

test("keeps unseeded CTE when version filter is absent", () => {
	const sql = `SELECT * FROM lix_internal_state_vtable;`;
	const rewritten = rewriteSql(sql);

	expect(rewritten).not.toContain("seed_versions");
	expect(rewritten).toContain("version_descriptor_base");
});

test("seeds version recursion when version filter uses anonymous placeholder", () => {
	const sql = `SELECT * FROM lix_internal_state_vtable WHERE version_id = ? AND schema_key = ?;`;
	const rewritten = rewriteSql(sql);
	expect(rewritten).toMatch(/params\(version_id/);
	expect(rewritten).toContain("?1 AS version_id");
	expect(rewritten).toContain("WHERE txn.schema_key = ?2");
});
