import { expect, test } from "vitest";
import { parse } from "../sql-parser/parse.js";
import { compile } from "../sql-parser/compile.js";
import { rewriteStateByVersionUpdate } from "./update.js";
import type { PreprocessorTraceEntry } from "../types.js";

const INTERNAL_VTABLE = "lix_internal_state_vtable";

function rewriteSql(sql: string, trace?: PreprocessorTraceEntry[]): string {
	const statements = parse(sql);
	const rewritten = rewriteStateByVersionUpdate({
		statements,
		parameters: [],
		...(trace ? { trace } : {}),
	});
	return compile(rewritten).sql;
}

test("rewrites state_by_version updates to the internal vtable", () => {
	const sql = `
		UPDATE state_by_version
		SET snapshot_content = json('{"value":"next"}')
		WHERE entity_id = 'row'
	`;

	const rewritten = rewriteSql(sql);
	const normalized = rewritten.replace(/\s+/g, " ").trim();

	expect(normalized).toContain(`UPDATE ${INTERNAL_VTABLE}`);
	expect(normalized).toContain("SET snapshot_content = json('{\"value\":\"next\"}')");
});

test("preserves aliases when rewriting", () => {
	const sql = `
		UPDATE state_by_version AS sbv
		SET sbv.plugin_key = 'plugin-2'
		WHERE sbv.version_id = 'child'
	`;

	const rewritten = rewriteSql(sql);
	const normalized = rewritten.replace(/\s+/g, " ").trim();

	expect(normalized).toContain(`UPDATE ${INTERNAL_VTABLE} AS sbv`);
});

test("emits trace entries for rewritten updates", () => {
	const sql = `
		UPDATE state_by_version
		SET plugin_key = 'updated'
		WHERE entity_id = 'row'
	`;
	const trace: PreprocessorTraceEntry[] = [];

	rewriteSql(sql, trace);
	expect(trace).toHaveLength(1);
	expect(trace[0]).toMatchObject({
		step: "rewrite_state_by_version_update",
		payload: { assignments: 1 },
	});
});

test("throws when unsupported columns are updated", () => {
	const sql = `
		UPDATE state_by_version
		SET bogus_column = 'nope'
		WHERE entity_id = 'row'
	`;

	expect(() => rewriteSql(sql)).toThrow(/Unsupported column/i);
});
