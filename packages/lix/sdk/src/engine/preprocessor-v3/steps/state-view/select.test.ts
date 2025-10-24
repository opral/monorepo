import { describe, expect, test } from "vitest";
import { parse } from "../../sql-parser/parse.js";
import { compile } from "../../compile.js";
import { rewriteStateViewSelect } from "./select.js";
import type { PreprocessorTraceEntry } from "../../types.js";

function run(sql: string) {
	const trace: PreprocessorTraceEntry[] = [];
	const statement = parse(sql);
	const rewritten = rewriteStateViewSelect({
		node: statement,
		getStoredSchemas: () => new Map(),
		getCacheTables: () => new Map(),
		getSqlViews: () => new Map(),
		hasOpenTransaction: () => true,
		trace,
	});
	return {
		trace,
		compiled: compile(rewritten),
	};
}

describe("rewriteStateViewSelect", () => {
	test("rewrites state view into state_all subquery", () => {
		const { compiled, trace } = run(`
			SELECT s.entity_id
			FROM state AS s
		`);

		const sql = compiled.sql.toUpperCase();
		expect(sql).toContain('FROM "STATE_ALL" AS "SA"');
		expect(sql).toContain('IN (SELECT "VERSION_ID" FROM "ACTIVE_VERSION")');
		expect(trace[0]?.payload).toMatchObject({
			reference_count: 1,
			bindings: ["s"],
		});
	});

	test("supports unaliased state reference", () => {
		const { compiled } = run(`
			SELECT *
			FROM state
		`);

		const sql = compiled.sql.toUpperCase();
		expect(sql).toContain('FROM "STATE_ALL" AS "SA"');
	});
});
