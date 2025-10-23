import { describe, expect, test } from "vitest";
import { compile } from "../../compile.js";
import { rewriteStateAllViewSelect } from "./select.js";
import type { PreprocessorTrace } from "../../types.js";
import { parse } from "../../sql-parser/parser.js";
import { toRootOperationNode } from "../../sql-parser/to-root-operation-node.js";

describe("rewriteStateAllViewSelect", () => {
	test("rewrites state_all reference into a vtable-backed subquery", () => {
		const node = toRootOperationNode(
			parse(`
				SELECT sa.*
				FROM state_all AS sa
				WHERE sa.schema_key = 'test_schema'
			`)
		);

		const trace: PreprocessorTrace = [];
		const rewritten = rewriteStateAllViewSelect({
			node,
			storedSchemas: new Map(),
			cacheTables: new Map(),
			trace,
		});

		const { sql } = compile(rewritten);

		expect(sql.toUpperCase()).not.toMatch(/\bFROM\s+"?STATE_ALL"?\b/);
		expect(sql.toUpperCase()).toContain('FROM "LIX_INTERNAL_STATE_VTABLE"');
		expect(sql).toContain("json(metadata)");
		expect(trace[0]?.payload).toMatchObject({
			reference_count: 1,
			bindings: ["sa"],
		});
	});

	test("rewrites nested state_all reference inside alias subquery", () => {
		const node = toRootOperationNode(
			parse(`
				SELECT wrapped.*
				FROM (
					SELECT *
					FROM state_all
					WHERE schema_key = 'test_schema'
				) AS wrapped
			`)
		);

		const trace: PreprocessorTrace = [];
		const rewritten = rewriteStateAllViewSelect({
			node,
			storedSchemas: new Map(),
			cacheTables: new Map(),
			trace,
		});

		const { sql } = compile(rewritten);
		const upper = sql.toUpperCase();

		expect(upper).not.toMatch(/\bFROM\s+"?STATE_ALL"?\b/);
		expect(upper).toContain('FROM "LIX_INTERNAL_STATE_VTABLE"');
		expect(trace[0]?.payload).toMatchObject({
			reference_count: 1,
			bindings: ["state_all"],
		});
	});
});
