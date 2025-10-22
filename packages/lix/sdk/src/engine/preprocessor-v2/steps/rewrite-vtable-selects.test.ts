import { expect, test } from "vitest";
import { internalQueryBuilder } from "../../internal-query-builder.js";
import { rewriteVtableSelects } from "./rewrite-vtable-selects.js";
import type { RootOperationNode } from "kysely";
import { compile } from "../compile.js";

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
});
