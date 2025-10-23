import { describe, expect, test } from "vitest";
import type { RootOperationNode } from "kysely";
import { internalQueryBuilder } from "../../../internal-query-builder.js";
import type { PreprocessorTrace } from "../../types.js";
import { compile } from "../../compile.js";
import { rewriteStateViewSelect } from "./select.js";

describe("rewriteStateViewSelect", () => {
	test("rewrites state view into a state_all-backed subquery", () => {
		const qb = internalQueryBuilder as any;
		const node = qb
			.selectFrom("state as s")
			.selectAll("s")
			.where("s.schema_key", "=", "test_schema")
			.toOperationNode() as RootOperationNode;

		const trace: PreprocessorTrace = [];
		const rewritten = rewriteStateViewSelect({
			node,
			storedSchemas: new Map(),
			cacheTables: new Map(),
			trace,
		});

		const { sql } = compile(rewritten);
		const upper = sql.toUpperCase();

		expect(upper).not.toMatch(/\bFROM\s+"?STATE"?\b/);
		expect(upper).toMatch(/\bFROM\s+\(SELECT\b/);
		expect(upper).toContain('FROM "STATE_ALL" AS "SA"');
		expect(upper).toMatch(
			/"SA"\."VERSION_ID" IN\s*\(SELECT "VERSION_ID" FROM "ACTIVE_VERSION"\)/
		);
		expect(trace[0]?.payload).toMatchObject({
			reference_count: 1,
			bindings: ["s"],
		});
	});

	test("rewrites nested state reference within an entity view alias", () => {
		const qb = internalQueryBuilder as any;
		const node = qb
			.selectFrom((eb: any) =>
				eb
					.selectFrom("state as s")
					.selectAll("s")
					.where("s.schema_key", "=", "test_schema")
					.as("wrapped")
			)
			.selectAll("wrapped")
			.toOperationNode() as RootOperationNode;

		const trace: PreprocessorTrace = [];
		const rewritten = rewriteStateViewSelect({
			node,
			storedSchemas: new Map(),
			cacheTables: new Map(),
			trace,
		});

		const { sql } = compile(rewritten);
		const upper = sql.toUpperCase();

		expect(upper).not.toMatch(/\bFROM\s+"?STATE"?\b/);
		expect(upper).toContain('FROM "STATE_ALL" AS "SA"');
		expect(upper).toMatch(
			/"SA"\."VERSION_ID" IN\s*\(SELECT "VERSION_ID" FROM "ACTIVE_VERSION"\)/
		);
		expect(trace[0]?.payload).toMatchObject({
			reference_count: 1,
			bindings: ["s"],
		});
	});
});
