import { expect, test } from "vitest";
import { parse } from "../sql-parser/parse.js";
import { compile } from "../sql-parser/compile.js";
import { rewriteStateByVersionSelect } from "./select.js";
import type { PreprocessorTraceEntry } from "../types.js";

const INTERNAL_VTABLE = "lix_internal_state_vtable";

function rewriteSql(sql: string, trace?: PreprocessorTraceEntry[]): string {
	const statements = parse(sql);
	const rewritten = rewriteStateByVersionSelect({
		statements,
		parameters: [],
		...(trace ? { trace } : {}),
	});
	return compile(rewritten).sql;
}

test("rewrites state_by_version selects to internal vtable", () => {
	const sql = `
		SELECT sa.entity_id
		FROM state_by_version AS sa
		WHERE sa.schema_key = 'demo'
	`;

	const rewritten = rewriteSql(sql);
	const normalized = rewritten.replace(/\s+/g, " ").trim().toLowerCase();

	expect(normalized).toContain("from (select");
	expect(normalized).toContain(INTERNAL_VTABLE);
	expect(normalized).toContain(") as sa where sa.schema_key = 'demo'");
});

test("injects default alias when queries omit one", () => {
	const sql = `
		SELECT state_by_version.entity_id
		FROM state_by_version
		WHERE state_by_version.file_id = 'file-1'
	`;

	const rewritten = rewriteSql(sql);
	const normalized = rewritten.replace(/\s+/g, " ").trim().toLowerCase();

	expect(normalized).toContain("from (select");
	expect(normalized).toContain(INTERNAL_VTABLE);
	expect(normalized).toContain(") as state_by_version");
});

test("rewrites nested subqueries referencing the view", () => {
	const sql = `
		SELECT derived.entity_id
		FROM (
			SELECT sbv.entity_id
			FROM state_by_version AS sbv
			WHERE EXISTS (
				SELECT 1
				FROM state_by_version
				WHERE state_by_version.entity_id = sbv.entity_id
			)
		) AS derived
	`;

	const rewritten = rewriteSql(sql);
	const normalized = rewritten.replace(/\s+/g, " ").trim().toLowerCase();

	const tableMentions =
		normalized.match(new RegExp(INTERNAL_VTABLE, "g")) ?? [];
	expect(tableMentions.length).toBe(2);
});

test("prunes unused columns from the rewritten view", () => {
	const sql = `
		SELECT entity_id
		FROM state_by_version
	`;
	const rewritten = rewriteSql(sql);
	const normalized = rewritten.replace(/\s+/g, " ").trim().toLowerCase();

	expect(normalized).toContain("select entity_id");
	expect(normalized).toContain(INTERNAL_VTABLE);
	expect(normalized).not.toMatch(/schema_key/);
	expect(normalized).not.toMatch(/metadata/);
	expect(normalized).not.toMatch(/source_tag/);
});

test("retains view-level filters and projection", () => {
	const sql = `
		SELECT *
		FROM state_by_version
	`;
	const rewritten = rewriteSql(sql);
	const normalized = rewritten.replace(/\s+/g, " ").trim().toLowerCase();

	expect(normalized).toContain("snapshot_content is not null");
	expect(normalized).not.toContain("source_tag");
});

test("emits trace entries when rewrites occur", () => {
	const sql = `
		SELECT entity_id FROM state_by_version
	`;
	const trace: PreprocessorTraceEntry[] = [];
	rewriteSql(sql, trace);
	expect(trace).toHaveLength(1);
	expect(trace[0]).toMatchObject({
		step: "rewrite_state_by_version_select",
		payload: { tables: 1 },
	});
});

test("non state_by_version selects are left untouched", () => {
	const sql = `
		SELECT id FROM other_table
	`;
	const rewritten = rewriteSql(sql);
	expect(rewritten.replace(/\s+/g, " ").trim()).toContain(
		"SELECT id FROM other_table"
	);
});
