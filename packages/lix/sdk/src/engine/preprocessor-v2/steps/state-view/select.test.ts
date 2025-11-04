import { describe, expect, test } from "vitest";
import type { PreprocessorTrace } from "../../types.js";
import { compile } from "../../compile.js";
import { rewriteStateViewSelect } from "./select.js";
import { parse } from "../../sql-parser/parser.js";
import { toRootOperationNode } from "../../sql-parser/to-root-operation-node.js";

describe("rewriteStateViewSelect", () => {
	test("rewrites state view into a state_by_version-backed subquery", () => {
		const node = toRootOperationNode(
			parse(`
			SELECT s.*
			FROM state AS s
			WHERE s.schema_key = 'test_schema'
		`)
		);

		const trace: PreprocessorTrace = [];
		const rewritten = rewriteStateViewSelect({
			node,
			storedSchemas: new Map(),
			cacheTables: new Map(),
			trace,
			hasOpenTransaction: true,
		});

		const { sql } = compile(rewritten);
		const upper = sql.toUpperCase();

		expect(upper).not.toMatch(/\bFROM\s+"?STATE"?\b/);
		expect(upper).toMatch(/\bFROM\s+\(SELECT\b/);
		expect(upper).toContain('FROM "STATE_BY_VERSION" AS "SA"');
		expect(upper).toMatch(
			/"SA"\."VERSION_ID" IN\s*\(SELECT "VERSION_ID" FROM "ACTIVE_VERSION"\)/
		);
		expect(trace[0]?.payload).toMatchObject({
			reference_count: 1,
			bindings: ["s"],
		});
	});

	test("rewrites nested state reference within an entity view alias", () => {
		const node = toRootOperationNode(
			parse(`
			SELECT wrapped.*
			FROM (
				SELECT s.*
				FROM state AS s
				WHERE s.schema_key = 'test_schema'
			) AS wrapped
		`)
		);

		const trace: PreprocessorTrace = [];
		const rewritten = rewriteStateViewSelect({
			node,
			storedSchemas: new Map(),
			cacheTables: new Map(),
			trace,
			hasOpenTransaction: true,
		});

		const { sql } = compile(rewritten);
		const upper = sql.toUpperCase();

		expect(upper).not.toMatch(/\bFROM\s+"?STATE"?\b/);
		expect(upper).toContain('FROM "STATE_BY_VERSION" AS "SA"');
		expect(upper).toMatch(
			/"SA"\."VERSION_ID" IN\s*\(SELECT "VERSION_ID" FROM "ACTIVE_VERSION"\)/
		);
		expect(trace[0]?.payload).toMatchObject({
			reference_count: 1,
			bindings: ["s"],
		});
	});
});
