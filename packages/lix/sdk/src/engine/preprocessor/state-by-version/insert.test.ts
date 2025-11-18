import { expect, test } from "vitest";
import { parse } from "../sql-parser/parse.js";
import { compile } from "../sql-parser/compile.js";
import { rewriteStateByVersionInsert } from "./insert.js";
import type { PreprocessorTraceEntry } from "../types.js";

const INTERNAL_VTABLE = "lix_internal_state_vtable";

function rewriteSql(sql: string, trace?: PreprocessorTraceEntry[]): string {
	const statements = parse(sql);
	const rewritten = rewriteStateByVersionInsert({
		statements,
		parameters: [],
		...(trace ? { trace } : {}),
	});
	return compile(rewritten).sql;
}

test("rewrites state_by_version inserts to internal vtable", () => {
	const sql = `
		INSERT INTO state_by_version (
			entity_id,
			schema_key,
			file_id,
			version_id,
			plugin_key,
			snapshot_content,
			schema_version,
			metadata,
			untracked
		) VALUES (?, ?, ?, ?, ?, json(?), ?, ?, ?)
	`;

	const rewritten = rewriteSql(sql);
	const normalized = rewritten.replace(/\s+/g, " ").trim();

	expect(normalized).toContain(`INSERT INTO ${INTERNAL_VTABLE}`);
	expect(normalized).toContain(
		"(entity_id, schema_key, file_id, version_id, plugin_key, snapshot_content, schema_version, metadata, untracked, inherited_from_version_id)"
	);
});

test("injects default metadata and untracked values when omitted", () => {
	const sql = `
		INSERT INTO state_by_version (
			entity_id,
			schema_key,
			file_id,
			version_id,
			plugin_key,
			snapshot_content,
			schema_version
		) VALUES ('row', 'schema', 'file', 'version', 'plugin', json('{}'), '1.0')
	`;

	const rewritten = rewriteSql(sql);
	const normalized = rewritten.replace(/\s+/g, " ").trim();

	expect(normalized).toMatch(/'1\.0'\s*,\s*NULL\s*,\s*NULL\s*,\s*0\)/);
});

test("preserves inherited_from_version_id values when provided", () => {
	const sql = `
		INSERT INTO state_by_version (
			entity_id,
			schema_key,
			file_id,
			version_id,
			plugin_key,
			snapshot_content,
			schema_version,
			inherited_from_version_id
		) VALUES ('row', 'schema', 'file', 'child', 'plugin', json('{}'), '1.0', 'parent')
	`;

	const rewritten = rewriteSql(sql);
	expect(rewritten.toLowerCase()).toContain("inherited_from_version_id");
	expect(rewritten).toContain("'parent'");
});

test("emits trace entries for rewritten statements", () => {
	const sql = `
		INSERT INTO state_by_version (
			entity_id,
			schema_key,
			file_id,
			version_id,
			plugin_key,
			snapshot_content,
			schema_version,
			inherited_from_version_id,
			metadata,
			untracked
		) VALUES ('row', 'schema', 'file', 'version', 'plugin', json('{}'), '1.0', 'global', json('{}'), 0)
	`;
	const trace: PreprocessorTraceEntry[] = [];
	rewriteSql(sql, trace);
	expect(trace).toHaveLength(1);
	expect(trace[0]).toMatchObject({
		step: "rewrite_state_by_version_insert",
		payload: { rows: 1 },
	});
});

test("throws when encountering unsupported columns", () => {
	const sql = `
		INSERT INTO state_by_version (
			entity_id,
			schema_key,
			file_id,
			version_id,
			plugin_key,
			snapshot_content,
			schema_version,
			bogus_column
		) VALUES ('row', 'schema', 'file', 'version', 'plugin', json('{}'), '1.0', 'nope')
	`;

	expect(() => {
		const statements = parse(sql);
		rewriteStateByVersionInsert({
			statements,
			parameters: [],
		});
	}).toThrowError(/Unsupported column/i);
});
