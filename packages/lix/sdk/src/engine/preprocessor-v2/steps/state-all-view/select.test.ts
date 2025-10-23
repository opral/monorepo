import { describe, expect, test } from "vitest";
import type { RootOperationNode } from "kysely";
import { internalQueryBuilder } from "../../../internal-query-builder.js";
import { compile } from "../../compile.js";
import { rewriteStateAllViewSelect } from "./select.js";
import type { PreprocessorTrace } from "../../types.js";

describe("rewriteStateAllViewSelect", () => {
	test("rewrites state_all reference into a vtable-backed subquery", () => {
		const qb = internalQueryBuilder as any;
		const node = qb
			.selectFrom("state_all as sa")
			.selectAll("sa")
			.where("sa.schema_key", "=", "test_schema")
			.toOperationNode() as RootOperationNode;

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
});
