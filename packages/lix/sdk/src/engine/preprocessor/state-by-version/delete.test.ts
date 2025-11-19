import { expect, test } from "vitest";
import { parse } from "../sql-parser/parse.js";
import { compile } from "../sql-parser/compile.js";
import { rewriteStateByVersionDelete } from "./delete.js";

const INTERNAL_VTABLE = "lix_internal_state_vtable";

function rewriteSql(sql: string): string {
	const statements = parse(sql);
	const rewritten = rewriteStateByVersionDelete({
		statements,
		parameters: [],
	});
	return compile(rewritten).sql;
}

test("rewrites deletes on state_by_version to internal vtable", () => {
	const sql = `
		DELETE FROM state_by_version
		WHERE schema_key = 'lix_key_value'
			AND version_id = 'global'
			AND entity_id = 'row-1'
	`;

	const rewritten = rewriteSql(sql);
	const normalized = rewritten.replace(/\s+/g, " ").trim();

	expect(normalized).toContain(`DELETE FROM ${INTERNAL_VTABLE}`);
	expect(normalized).not.toContain("state_by_version.");
});

test("preserves aliases in delete rewrites", () => {
	const sql = `
		DELETE FROM state_by_version AS sbv
		WHERE sbv.schema_key = 'lix_key_value'
			AND sbv.entity_id = 'row-1'
	`;

	const rewritten = rewriteSql(sql);

	const normalized = rewritten.replace(/\s+/g, " ").trim();

	expect(normalized).toContain(`DELETE FROM ${INTERNAL_VTABLE} AS sbv`);
	expect(normalized).toContain("schema_key = 'lix_key_value'");
});

test("returns original statement for non-state deletes", () => {
	const sql = `
		DELETE FROM other_table WHERE id = 'row-1'
	`;

	const rewritten = rewriteSql(sql);
	const normalized = rewritten.replace(/\s+/g, " ").trim();

	expect(normalized).toContain("DELETE FROM other_table");
});
