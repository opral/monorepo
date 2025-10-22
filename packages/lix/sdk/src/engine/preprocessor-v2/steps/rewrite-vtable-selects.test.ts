import { expect, test } from "vitest";
import { internalQueryBuilder } from "../../internal-query-builder.js";
import {
	REWRITTEN_STATE_VTABLE,
	rewriteVtableSelects,
} from "./rewrite-vtable-selects.js";
import type { RootOperationNode, SelectQueryNode } from "kysely";
import { compile } from "../compile.js";
import { extractCteName } from "../utils.js";

test("hoists to lix_internal_state_vtable_rewritten", () => {
	const node = internalQueryBuilder
		.selectFrom("lix_internal_state_vtable")
		.selectAll()
		.toOperationNode() as RootOperationNode;

	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map(),
	});

	const { sql } = compile(rewritten);

	expect(sql).toContain("lix_internal_state_vtable_rewritten");
	expect(sql).not.toMatch(/\blix_internal_state_vtable\b/);
});

test("hoists a CTE for the rewritten vtable", () => {
	const node = internalQueryBuilder
		.selectFrom("lix_internal_state_vtable")
		.selectAll()
		.toOperationNode() as RootOperationNode;

	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map(),
	});

	const select = rewritten as SelectQueryNode;
	const ctes = select.with?.expressions ?? [];

	expect(ctes.length).toBeGreaterThan(0);
	const cteNames = ctes.map(extractCteName);
	expect(cteNames).toContain(REWRITTEN_STATE_VTABLE);

	const { sql } = compile(rewritten);
	const normalized = sql.trim().toUpperCase();

	expect(normalized).toMatch(/^WITH\b/);
	expect(sql).toContain("hoisted_lix_internal_state_vtable_rewrite");
	expect(sql).toContain(REWRITTEN_STATE_VTABLE);
});
